'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, RefreshCcw, Search, User, Award, Briefcase } from 'lucide-react';
import StaffPerformanceChart from '@/components/reports/StaffPerformanceChart';
import ExportOptions from '@/components/reports/ExportOptions';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StaffReportsPage() {
  // 状態の定義
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [staffData, setStaffData] = useState<any>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  // 期間の変更ハンドラー
  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'custom') => {
    setPeriod(newPeriod);
    
    if (newPeriod === 'month') {
      setDateRange({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      });
    } else if (newPeriod === 'week') {
      setDateRange({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 })
      });
    }
    // customの場合は現在の範囲を維持
  };

  // データ取得関数
  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      let queryParams = new URLSearchParams({
        period: period,
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      });

      if (departmentFilter !== 'all') {
        queryParams.append('department', departmentFilter);
      }

      const response = await fetch(`/api/admin/reports/staff?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('データ取得に失敗しました');
      }
      
      const data = await response.json();
      setStaffData(data);
      toast.success('スタッフデータを更新しました');
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast.error('スタッフデータの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // マウント時とパラメータ変更時にデータ取得
  useEffect(() => {
    fetchStaffData();
  }, [period, dateRange.from, dateRange.to, departmentFilter]);

  // 期間表示のフォーマット
  const formatDateRange = () => {
    return `${format(dateRange.from, 'yyyy年MM月dd日', { locale: ja })} - ${format(dateRange.to, 'yyyy年MM月dd日', { locale: ja })}`;
  };

  // 擬似データ（APIからの応答がない場合のフォールバック）
  const mockStaffData = {
    period: {
      start: dateRange.from,
      end: dateRange.to,
      type: period
    },
    summary: {
      totalStaff: 15,
      totalWorkingHours: 2350.5,
      averagePerformanceScore: 82.7,
      topPerformer: {
        userId: "user5",
        name: "田中健太",
        performanceScore: 94.8,
        department: "営業"
      },
      departments: [
        { name: "営業", count: 5 },
        { name: "カウンター", count: 4 },
        { name: "キッチン", count: 3 },
        { name: "管理", count: 3 }
      ]
    },
    staffList: [
      {
        userId: "user1",
        name: "山田太郎",
        profileImage: null,
        department: "営業",
        performanceScore: 87.5,
        totalWorkingHours: 160.5,
        punctualityRate: 95.2,
        averageWorkingHours: 8.0,
        estimatedWage: 192600,
        lastShift: "2025-04-18",
        position: "正社員",
        topSkills: ["顧客対応", "リーダーシップ", "販売"]
      },
      {
        userId: "user2",
        name: "佐藤花子",
        profileImage: null,
        department: "カウンター",
        performanceScore: 82.3,
        totalWorkingHours: 145.0,
        punctualityRate: 90.0,
        averageWorkingHours: 7.6,
        estimatedWage: 174000,
        lastShift: "2025-04-19",
        position: "アルバイト",
        topSkills: ["レジ操作", "接客", "クレーム対応"]
      },
      {
        userId: "user3",
        name: "鈴木一郎",
        profileImage: null,
        department: "キッチン",
        performanceScore: 91.2,
        totalWorkingHours: 155.5,
        punctualityRate: 97.5,
        averageWorkingHours: 7.8,
        estimatedWage: 186600,
        lastShift: "2025-04-20",
        position: "アルバイト",
        topSkills: ["調理", "衛生管理", "スピード"]
      },
      {
        userId: "user4",
        name: "高橋真理",
        profileImage: null,
        department: "カウンター",
        performanceScore: 78.9,
        totalWorkingHours: 130.0,
        punctualityRate: 85.0,
        averageWorkingHours: 6.5,
        estimatedWage: 156000,
        lastShift: "2025-04-19",
        position: "アルバイト",
        topSkills: ["レジ操作", "接客", "商品知識"]
      },
      {
        userId: "user5",
        name: "田中健太",
        profileImage: null,
        department: "営業",
        performanceScore: 94.8,
        totalWorkingHours: 172.5,
        punctualityRate: 98.0,
        averageWorkingHours: 8.6,
        estimatedWage: 207000,
        lastShift: "2025-04-20",
        position: "正社員",
        topSkills: ["交渉", "顧客管理", "提案力"]
      }
    ],
    departmentStats: [
      {
        department: "営業", 
        avgPerformance: 88.2, 
        totalStaff: 5, 
        totalHours: 820.5, 
        avgWage: 196800
      },
      {
        department: "カウンター", 
        avgPerformance: 81.5, 
        totalStaff: 4, 
        totalHours: 530.0, 
        avgWage: 159000
      },
      {
        department: "キッチン", 
        avgPerformance: 85.3, 
        totalStaff: 3, 
        totalHours: 455.0, 
        avgWage: 175500
      },
      {
        department: "管理", 
        avgPerformance: 90.2, 
        totalStaff: 3, 
        totalHours: 545.0, 
        avgWage: 218000
      }
    ]
  };

  // フィルター適用済みのスタッフリストを取得
  const getFilteredStaffList = () => {
    const data = staffData || mockStaffData;
    return data.staffList.filter((staff: any) => {
      const matchesSearch = searchTerm === '' || 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.position.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === 'all' || staff.department === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
  };

  // 選択されたスタッフの詳細データを取得
  const getSelectedStaffDetails = () => {
    const data = staffData || mockStaffData;
    return data.staffList.find((staff: any) => staff.userId === selectedStaff) || null;
  };

  // パフォーマンススコアカラーを取得する関数
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="container p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">スタッフレポート</h1>
          <p className="text-muted-foreground mt-1">
            スタッフのパフォーマンス、勤務状況、スキルの詳細分析
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchStaffData}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>更新</span>
        </Button>
      </header>

      {/* フィルターオプション */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="font-medium">期間:</div>
          <Select value={period} onValueChange={(value: any) => handlePeriodChange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">週次</SelectItem>
              <SelectItem value="month">月次</SelectItem>
              <SelectItem value="custom">カスタム</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDateRange()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => range && setDateRange({ 
                from: range.from || dateRange.from, 
                to: range.to || dateRange.to 
              })}
              numberOfMonths={2}
              locale={ja}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center space-x-4 ml-auto">
          <div className="font-medium">部署:</div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="部署を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {(staffData?.summary?.departments || mockStaffData.summary.departments).map((dept: any, index: number) => (
                <SelectItem key={index} value={dept.name}>
                  {dept.name} ({dept.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="スタッフ名やスキルで検索"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* エクスポートオプション */}
      <ExportOptions
        title="スタッフパフォーマンスレポート"
        description={`期間: ${formatDateRange()}`}
        data={staffData || mockStaffData}
        type="staff"
        period={{
          start: dateRange.from,
          end: dateRange.to,
          type: period
        }}
        customOptions={{
          includeCharts: true,
          includeSummary: true,
          includeDetails: true
        }}
      />

      {/* タブ切り替え */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid md:grid-cols-3">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="staff">スタッフ一覧</TabsTrigger>
          <TabsTrigger value="charts">グラフ分析</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* タブコンテンツ - 概要 */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総スタッフ数</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (staffData?.summary?.totalStaff || mockStaffData.summary.totalStaff)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">平均パフォーマンススコア</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (
                  `${(staffData?.summary?.averagePerformanceScore || mockStaffData.summary.averagePerformanceScore).toFixed(1)}`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総勤務時間</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (
                  `${(staffData?.summary?.totalWorkingHours || mockStaffData.summary.totalWorkingHours).toFixed(1)} 時間`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">トップパフォーマー</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>読込中...</div>
              ) : (
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={null} alt="Top performer" />
                    <AvatarFallback>{(staffData?.summary?.topPerformer?.name || mockStaffData.summary.topPerformer.name).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{staffData?.summary?.topPerformer?.name || mockStaffData.summary.topPerformer.name}</div>
                    <div className="text-sm text-muted-foreground">{staffData?.summary?.topPerformer?.department || mockStaffData.summary.topPerformer.department}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 部署別統計 */}
        <Card>
          <CardHeader>
            <CardTitle>部署別パフォーマンス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3">部署</th>
                    <th scope="col" className="px-6 py-3">スタッフ数</th>
                    <th scope="col" className="px-6 py-3">平均パフォーマンス</th>
                    <th scope="col" className="px-6 py-3">総勤務時間</th>
                    <th scope="col" className="px-6 py-3">平均給与</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [] : (staffData?.departmentStats || mockStaffData.departmentStats)).map((dept: any, index: number) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium">{dept.department}</td>
                      <td className="px-6 py-4">{dept.totalStaff}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className={`h-2.5 rounded-full ${getPerformanceColor(dept.avgPerformance)}`} 
                              style={{ width: `${dept.avgPerformance}%` }}
                            ></div>
                          </div>
                          <span>{dept.avgPerformance.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{dept.totalHours.toFixed(1)} 時間</td>
                      <td className="px-6 py-4">¥{dept.avgWage.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* タブコンテンツ - スタッフ一覧 */}
      <TabsContent value="staff">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1 space-y-4">
            <Card className="h-[calc(100vh-20rem)] overflow-auto">
              <CardHeader>
                <CardTitle>スタッフリスト</CardTitle>
                <CardDescription>
                  {getFilteredStaffList().length} 人のスタッフが見つかりました
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {getFilteredStaffList().map((staff: any) => (
                    <Button
                      key={staff.userId}
                      variant={selectedStaff === staff.userId ? "default" : "ghost"}
                      className="w-full justify-start py-2 px-4"
                      onClick={() => setSelectedStaff(staff.userId)}
                    >
                      <div className="flex items-center w-full">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={staff.profileImage} alt={staff.name} />
                          <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium truncate">{staff.name}</span>
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                              staff.performanceScore >= 90 ? 'bg-green-100 text-green-800' : 
                              staff.performanceScore >= 80 ? 'bg-blue-100 text-blue-800' : 
                              staff.performanceScore >= 70 ? 'bg-amber-100 text-amber-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {staff.performanceScore.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {staff.department} • {staff.position}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            {selectedStaff ? (
              <StaffDetails staff={getSelectedStaffDetails()} />
            ) : (
              <Card className="h-full flex items-center justify-center p-10 text-center">
                <div>
                  <User className="h-16 w-16 mb-4 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">スタッフを選択してください</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    左側のリストからスタッフを選択すると、詳細なパフォーマンスデータとスキル分析が表示されます。
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      {/* グラフタブ */}
      <TabsContent value="charts">
        <StaffPerformanceChart data={staffData || mockStaffData} />
      </TabsContent>
    </div>
  );
}

// スタッフ詳細コンポーネント
function StaffDetails({ staff }: { staff: any }) {
  if (!staff) return null;

  // スキルバッジのカラー
  const getSkillColor = (index: number) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 
      'bg-amber-100 text-amber-800', 'bg-indigo-100 text-indigo-800'];
    return colors[index % colors.length];
  };

  // パフォーマンスカテゴリ
  const performanceCategories = [
    { name: '勤務時間', score: Math.round(staff.totalWorkingHours / 2), max: 100 },
    { name: '時間厳守', score: Math.round(staff.punctualityRate), max: 100 },
    { name: '勤務効率', score: Math.round(staff.performanceScore), max: 100 },
    { name: '平均勤務', score: Math.round(staff.averageWorkingHours * 10), max: 100 },
  ];

  return (
    <Card className="h-[calc(100vh-20rem)] overflow-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-4">
              <AvatarImage src={staff.profileImage} alt={staff.name} />
              <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{staff.name}</CardTitle>
              <div className="text-muted-foreground">{staff.department} • {staff.position}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              staff.performanceScore >= 90 ? 'bg-green-100 text-green-800' : 
              staff.performanceScore >= 80 ? 'bg-blue-100 text-blue-800' : 
              staff.performanceScore >= 70 ? 'bg-amber-100 text-amber-800' : 
              'bg-red-100 text-red-800'
            }`}>
              スコア: {staff.performanceScore.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              最終勤務: {format(new Date(staff.lastShift), 'yyyy/MM/dd', { locale: ja })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* パフォーマンスグリッド */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-sm font-medium text-muted-foreground">勤務時間</div>
            <div className="text-2xl font-bold mt-1">{staff.totalWorkingHours.toFixed(1)}時間</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-sm font-medium text-muted-foreground">定時出勤率</div>
            <div className="text-2xl font-bold mt-1">{staff.punctualityRate.toFixed(1)}%</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-sm font-medium text-muted-foreground">平均勤務</div>
            <div className="text-2xl font-bold mt-1">{staff.averageWorkingHours.toFixed(1)}時間/日</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-sm font-medium text-muted-foreground">給与予測</div>
            <div className="text-2xl font-bold mt-1">¥{staff.estimatedWage.toLocaleString()}</div>
          </div>
        </div>

        {/* スキル */}
        <div>
          <h3 className="text-lg font-medium mb-3">スキル & 特性</h3>
          <div className="flex flex-wrap gap-2">
            {staff.topSkills.map((skill: string, index: number) => (
              <span 
                key={index} 
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSkillColor(index)}`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* パフォーマンスレーダー (視覚的表現) */}
        <div>
          <h3 className="text-lg font-medium mb-3">パフォーマンス分析</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performanceCategories.map((category, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-sm text-muted-foreground">{category.score}/{category.max}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      (category.score / category.max) >= 0.9 ? 'bg-green-500' : 
                      (category.score / category.max) >= 0.8 ? 'bg-blue-500' : 
                      (category.score / category.max) >= 0.7 ? 'bg-amber-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${(category.score / category.max) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 勤務履歴サマリー */}
        <div>
          <h3 className="text-lg font-medium mb-3">勤務履歴サマリー</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>項目</TableHead>
                <TableHead>値</TableHead>
                <TableHead>評価</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>総労働時間</TableCell>
                <TableCell>{staff.totalWorkingHours.toFixed(1)} 時間</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    staff.totalWorkingHours > 150 ? 'bg-green-100 text-green-800' : 
                    staff.totalWorkingHours > 100 ? 'bg-blue-100 text-blue-800' : 
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {staff.totalWorkingHours > 150 ? '優秀' : 
                     staff.totalWorkingHours > 100 ? '良好' : '改善の余地あり'}
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>時間厳守率</TableCell>
                <TableCell>{staff.punctualityRate.toFixed(1)}%</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    staff.punctualityRate >= 95 ? 'bg-green-100 text-green-800' : 
                    staff.punctualityRate >= 85 ? 'bg-blue-100 text-blue-800' : 
                    staff.punctualityRate >= 75 ? 'bg-amber-100 text-amber-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {staff.punctualityRate >= 95 ? '非常に優秀' : 
                     staff.punctualityRate >= 85 ? '優秀' : 
                     staff.punctualityRate >= 75 ? '改善の余地あり' : 
                     '要注意'}
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>平均勤務時間</TableCell>
                <TableCell>{staff.averageWorkingHours.toFixed(1)} 時間/日</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    staff.averageWorkingHours >= 8 ? 'bg-green-100 text-green-800' : 
                    staff.averageWorkingHours >= 7 ? 'bg-blue-100 text-blue-800' : 
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {staff.averageWorkingHours >= 8 ? 'フルタイム' : 
                     staff.averageWorkingHours >= 7 ? '標準' : 'パートタイム'}
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>総合パフォーマンス</TableCell>
                <TableCell>{staff.performanceScore.toFixed(1)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    staff.performanceScore >= 90 ? 'bg-green-100 text-green-800' : 
                    staff.performanceScore >= 80 ? 'bg-blue-100 text-blue-800' : 
                    staff.performanceScore >= 70 ? 'bg-amber-100 text-amber-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {staff.performanceScore >= 90 ? '優秀' : 
                     staff.performanceScore >= 80 ? '良好' : 
                     staff.performanceScore >= 70 ? '普通' : 
                     '要改善'}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 