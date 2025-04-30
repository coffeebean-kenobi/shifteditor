# Shift Editor 本番環境デプロイ手順 (OCI)

このドキュメントでは、Shift Editor を Oracle Cloud Infrastructure (OCI) 上に本番環境として構築し、既存の開発環境からデータと設定を移行する方法を説明します。

---

## 1. 全体アーキテクチャ

```
┌────────┐        ┌───────────────────┐
│Client  │ <───▶ │  OCI LB (HTTPS)   │
└────────┘        └────────┬──────────┘
                            │
                ┌───────────▼───────────┐
                │  Container Instance   │  (Next.js + Prisma)
                └───────────┬───────────┘
                            │ (TCP/5432, VCN内)
                ┌───────────▼───────────┐
                │ Database for PostgreSQL│ (フルマネージド)
                └────────────────────────┘
```

- **Next.js アプリ** は OCI **Container Instance** (あるいは OKE) 上で動作。Docker イメージは OCIR から pull。  
- **DB** は OCI の "Database Service for PostgreSQL" を使用。高可用・バックアップ込み。  
- **VCN** 内部通信のみで DB を公開せず、外向きは HTTPS (443) のみ。  
- 秘密情報は **OCI Vault / Secrets** で管理し、コンテナへ環境変数として注入。

---

## 2. 事前準備
1. **OCI CLI** と **Docker** をインストールし、`oci setup config` で API キーを設定。  
2. **Terraform** を使う場合は v1.6 以降を用意。  
3. OCIR (Oracle Cloud Registry) ネームスペース確認: `phx.ocir.io/<tenancy-namespace>` など。

---

## 3. ネットワーク (VCN) 構築

| リソース | 用途 | 設定ポイント |
|-----------|------|---------------|
| VCN | アプリ & DB 用の仮想 NW | CIDR 例 `10.0.0.0/16` |
| Public Subnet | LB / Bastion 用 | インターネット GW へルート |
| Private Subnet | ContainerInstance / DB | No Internet, Service GW 経由で OS 更新 |
| Security List | | 443 → LB, 80(Optional) / 5432 → ContainerInstance からのみ許可 |

Terraform 例 (抜粋):
```hcl
resource "oci_core_vcn" "shift_vcn" {
  cidr_block = "10.0.0.0/16"
  compartment_id = var.compartment_id
  display_name = "shift-editor-vcn"
}
```

---

## 4. DB (Database for PostgreSQL) 作成
1. OCI コンソール → Database → PostgreSQL → **Create Cluster**。  
2. DB 名: `shift_editor_prod`、バージョン **15** 以上。  
3. 認証ユーザ `app_user` と強力なパスワードを設定。  
4. ネットワーク: 上記 **Private Subnet** を選択。  
5. 接続エンドポイント (`dbhost.subnet.subnetId.postgres.database.oraclecloud.com`) を控える。
6. 自動バックアップ / 自動パッチを有効化。

> 既存データを移行する場合は `pg_dump` / `pg_restore` or `pg_dumpall` を使用 (後述)。

---

## 5. コンテナイメージのビルド & OCIR へ push
```bash
# 1) ビルド (production モード)
TAG=phx.ocir.io/<tenancy-namespace>/shift-editor:prod
DOCKER_BUILDKIT=1 docker build -t $TAG --target prod .

# 2) OCIR ログイン
docker login phx.ocir.io -u '<tenancy-namespace>/<oci-username>' -p 'OCI_cli_token'

# 3) push
docker push $TAG
```

---

## 6. Secrets/Vault 設定

| Secret 名 | 値の例 |
|-----------|--------|
| `DB_PASSWORD` | (Database 作成時のパスワード) |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` |

OCI Vault → Secrets に登録後、OCID をメモ。

---

## 7. Container Instance の作成
CLI 例：
```bash
oci container instance create \
  --compartment-id <compartment_ocid> \
  --display-name shift-editor-prod \
  --shape "CI.Standard.E4.Flex" \
  --shape-config '{"ocpus":2, "memoryInGBs":4}' \
  --container-config file://container_config.json \
  --vnics '[{"subnetId":"<private_subnet_ocid>","isPublicIpAssigned":false}]'
```

`container_config.json` 例:
```json
{
  "containers": [
    {
      "imageUrl": "phx.ocir.io/<tenancy-namespace>/shift-editor:prod",
      "command": [
        "sh", "-c",
        "npx prisma migrate deploy && node .next/standalone/server.js"
      ],
      "env": [
        { "name": "DATABASE_URL", "value": "postgresql://app_user:${DB_PASSWORD}@<db-host>:5432/shift_editor_prod?connection_limit=20&sslmode=require" },
        { "name": "NEXTAUTH_URL",  "value": "https://shift.example.com" },
        { "name": "NEXTAUTH_SECRET", "valueFromSecret": "<ocid_of_NEXTAUTH_SECRET>" },
        { "name": "NODE_ENV", "value": "production" }
      ],
      "volumeMounts": []
    }
  ],
  "volumes": []
}
```
- `valueFromSecret` を使うことで、OCI Vault のシークレット値が環境変数に注入されます。
- `connection_limit=20` で Prisma の接続プール上限を指定 (DB 側の `max_connections` も考慮)。

---

## 8. ドメイン & HTTPS
1. OCI Load Balancer (L7) を Public Subnet に配置し、443/80 → Container Instance の 3000 にフォワード。  
2. 証明書管理: OCI Certificate Authority または ACM で TLS 証明書を登録。  
3. DNS (OCI DNS Zone) で `shift.example.com` を LB IP/hostname に CNAME/ALIAS。

---

## 9. データ移行手順 (開発 → 本番)
### 9.1 スキーマ同期
```bash
# 開発ブランチで確定したマイグレーションをコミット済みとする
npx prisma migrate deploy --schema prisma/schema.prisma --skip-generate \
  --preview-feature --telemetry-information="ci=true"
```
コンテナ起動時にも `migrate deploy` を実行しているため、再適用されても問題ありません (冪等)。

### 9.2 データコピー
```bash
# 開発 DB から本番 DB へ (例)
pg_dump -Fc -h dev-db -U postgres shift_editor | \
  pg_restore -h <db-host> -U app_user -d shift_editor_prod -Fc -c
```
※ PG 15+ 推奨。VPN/VCN Peering 経由でのみアクセス可にすること。

---

## 10. 運用 Tips
| 項目 | 内容 |
|------|------|
| バックアップ | Database for PostgreSQL の自動バックアップ (毎日) + 定期エクスポート (pg_dump) |
| スケール | Container Instance の `shape` 変更 or OKE で HPA |
| ログ | OCI Logging にルーティング (ContainerInstance → Logging) |
| 監視 | OCI Service Metrics (CPU/Memory) + Query against Database |
| ロールアウト | 新タグを push → `oci container instance update` でイメージ更新 (ゼロダウン可) |

---

## 11. まとめ
- **Secrets/Vault** でパスワードを安全に管理。  
- **Private Subnet** & Security List で DB を非公開に。  
- Prisma の `connection_limit` で接続プールを最適化。  
- Terraform or OCI CLI で IaC 化して再現性を確保。  

以上で、OCI 上の本番環境構築と移行に必要な手順を網羅しました。 