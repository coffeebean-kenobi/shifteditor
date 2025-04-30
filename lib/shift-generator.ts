import { addDays, addHours, setHours, setMinutes, isBefore, isAfter, differenceInHours, getDay, parseISO } from 'date-fns';

// 店舗の営業時間定義
export interface BusinessHour {
  dayOfWeek: number; // 0: 日曜日, 1: 月曜日, ..., 6: 土曜日
  openTime: string; // 例: "10:00"
  closeTime: string; // 例: "22:00"
}

// 従業員データ
export interface Employee {
  id: string;
  name: string;
  maxHoursPerWeek: number;
  position: string[];
  minHoursPerWeek?: number;
  preferredDays?: number[]; // 希望の曜日 (0-6)
  skills?: string[];
  hourlyRate?: number;
  availability?: EmployeeAvailability[];
  weeklyShiftCount?: number; // 自動生成中に使用する一時的なカウンター
  weeklyWorkHours?: number; // 自動生成中に使用する一時的なカウンター
  lastAssignedDate?: Date | null; // 連続シフト防止用の最終割り当て日
  shiftFulfillmentRate?: number; // 希望達成率
}

// 従業員のシフト希望/可能時間
export interface EmployeeAvailability {
  employeeId: string;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  priority: number; // 1-5 (5が最優先)
  note?: string;
}

// シフトイベント
export interface ShiftEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  employeeId: string;
  employeeName?: string;
  position?: string;
  color?: string;
  note?: string;
}

// 必要スタッフ条件
export interface StaffRequirement {
  dayOfWeek: number; // 0-6
  timeSlot: 'morning' | 'afternoon' | 'evening';
  count: number; // 必要な人数
  requiredPositions?: { [position: string]: number }; // 必要なポジション別人数
}

// シフト自動生成の設定
export interface ShiftGenerationConfig {
  startDate: Date;
  endDate: Date;
  businessHours: BusinessHour[];
  employees: Employee[];
  staffRequirements: StaffRequirement[];
  employeeAvailability?: EmployeeAvailability[];
  maxConsecutiveDays?: number; // 最大連続勤務日数
  minRestHours?: number; // シフト間の最小休息時間数
  prioritizeEvenDistribution?: boolean; // シフトの公平な分配を優先
  respectPositionSkills?: boolean; // ポジションスキルを尊重
}

// 従業員の制約チェックの結果
interface EmployeeConstraintCheck {
  employee: Employee;
  isAvailable: boolean;
  hasRequiredSkills: boolean;
  hasConsecutiveShift: boolean;
  hasEnoughRest: boolean;
  violatesMaxHours: boolean;
  priority: number;
}

/**
 * 従業員の希望可能時間帯を解析し、指定時間にシフト可能かを判定
 */
export function isEmployeeAvailable(
  employee: Employee,
  date: Date,
  startTime: Date,
  endTime: Date,
  availabilityList: EmployeeAvailability[]
): { isAvailable: boolean; priority: number } {
  const employeeAvailability = availabilityList.filter(
    a => a.employeeId === employee.id && 
    isSameDay(new Date(a.date), date)
  );

  // 可能時間の登録がない場合はデフォルトで優先度0で可能とする
  if (employeeAvailability.length === 0) {
    return { isAvailable: true, priority: 0 };
  }

  // 時間帯が希望時間内に収まるか確認
  for (const avail of employeeAvailability) {
    const availStartTime = new Date(avail.startTime);
    const availEndTime = new Date(avail.endTime);

    // シフト時間が希望時間内に完全に含まれるか
    if (
      (isBefore(availStartTime, startTime) || availStartTime.getTime() === startTime.getTime()) && 
      (isAfter(availEndTime, endTime) || availEndTime.getTime() === endTime.getTime())
    ) {
      return { isAvailable: true, priority: avail.priority };
    }
  }

  return { isAvailable: false, priority: 0 };
}

/**
 * 従業員が持つスキル/ポジションに基づいて、指定ポジションに適合するか判定
 */
export function hasRequiredSkill(employee: Employee, requiredPosition: string): boolean {
  return employee.position.includes(requiredPosition);
}

/**
 * 従業員の連続勤務日数をチェック
 */
export function checkConsecutiveDays(
  employee: Employee,
  date: Date,
  existingShifts: ShiftEvent[],
  maxConsecutiveDays: number = 5
): boolean {
  if (!employee.lastAssignedDate) return true;

  // 前日までの連続勤務日数を計算
  let consecutiveDays = 0;
  const currentDay = new Date(date);
  currentDay.setHours(0, 0, 0, 0);
  
  // 前回のシフトから日数を計算
  const lastDate = new Date(employee.lastAssignedDate);
  lastDate.setHours(0, 0, 0, 0);

  let checkDate = new Date(currentDay);
  checkDate.setDate(checkDate.getDate() - 1);
  
  while (checkDate.getTime() >= lastDate.getTime()) {
    // この日にシフトがあるか確認
    const hasShiftOnDate = existingShifts.some(shift => {
      const shiftDate = new Date(shift.start);
      shiftDate.setHours(0, 0, 0, 0);
      return shift.employeeId === employee.id && shiftDate.getTime() === checkDate.getTime();
    });

    if (hasShiftOnDate) {
      consecutiveDays++;
    } else {
      break; // 連続が途切れた
    }
    
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return consecutiveDays < maxConsecutiveDays;
}

/**
 * シフト間の休息時間を確認
 */
export function hasEnoughRest(
  employee: Employee,
  startTime: Date,
  existingShifts: ShiftEvent[],
  minRestHours: number = 10
): boolean {
  // 過去のシフトの中から、この従業員の直近のシフトを見つける
  const employeeShifts = existingShifts.filter(shift => shift.employeeId === employee.id);
  
  if (employeeShifts.length === 0) return true;

  // 直近のシフトの終了時間を取得
  const latestShift = employeeShifts
    .map(shift => ({ shift, endTime: new Date(shift.end) }))
    .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())[0];

  if (!latestShift) return true;

  // シフト終了から次のシフト開始までの時間（時間単位）
  const hoursBetweenShifts = differenceInHours(startTime, latestShift.endTime);
  
  return hoursBetweenShifts >= minRestHours;
}

/**
 * 週間労働時間の制限をチェック
 */
export function checkWeeklyHoursLimit(
  employee: Employee, 
  shiftDuration: number
): boolean {
  const currentWeeklyHours = employee.weeklyWorkHours || 0;
  return (currentWeeklyHours + shiftDuration) <= employee.maxHoursPerWeek;
}

/**
 * 従業員のシフト割り当て評価スコアを計算
 */
export function calculateAssignmentScore(
  employee: Employee,
  date: Date,
  startTime: Date,
  endTime: Date,
  position: string,
  existingShifts: ShiftEvent[],
  availability: EmployeeAvailability[],
  config: ShiftGenerationConfig
): number {
  const shiftDuration = differenceInHours(endTime, startTime);
  const { isAvailable, priority } = isEmployeeAvailable(employee, date, startTime, endTime, availability);
  
  if (!isAvailable) return -1000; // 希望時間外
  if (!hasRequiredSkill(employee, position)) return -800; // スキル不足
  
  let score = 0;
  
  // 希望優先度（0-5）× 20ポイント
  score += priority * 20;
  
  // 週間労働時間が上限に達しそうか（-10〜0）
  const weeklyHoursLeft = (employee.maxHoursPerWeek || 40) - (employee.weeklyWorkHours || 0);
  if (weeklyHoursLeft < shiftDuration) {
    return -500; // 週間上限オーバー
  } else {
    // 残り時間が少ないほど低スコア
    score -= Math.max(0, 10 - (weeklyHoursLeft / 4));
  }
  
  // 連続シフトがある場合は減点（-15〜0）
  if (employee.lastAssignedDate) {
    const daysSinceLastShift = Math.floor(
      (date.getTime() - new Date(employee.lastAssignedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastShift === 0) {
      score -= 5; // 同日シフト
    } else if (daysSinceLastShift === 1) {
      score -= 2; // 連続日シフト
    }
  }

  // シフト希望達成率が低い従業員を優先（0〜15）
  const fulfillmentRate = employee.shiftFulfillmentRate || 0.5;
  score += Math.round((1 - fulfillmentRate) * 15);
  
  // 最小勤務時間の確保（0〜10）
  if (employee.minHoursPerWeek && (employee.weeklyWorkHours || 0) < employee.minHoursPerWeek) {
    score += 10;
  }
  
  // 優先日の場合加点（10）
  if (employee.preferredDays && employee.preferredDays.includes(getDay(date))) {
    score += 10;
  }

  return score;
}

/**
 * シフト自動生成のメイン関数
 */
export function generateShifts(config: ShiftGenerationConfig): ShiftEvent[] {
  const {
    startDate,
    endDate,
    businessHours,
    employees,
    staffRequirements,
    employeeAvailability = [],
    maxConsecutiveDays = 5,
    minRestHours = 10,
    prioritizeEvenDistribution = true,
    respectPositionSkills = true
  } = config;
  
  // 従業員の作業状態をコピーして初期化
  const workingEmployees = employees.map(emp => ({
    ...emp,
    weeklyShiftCount: 0,
    weeklyWorkHours: 0,
    lastAssignedDate: null as Date | null,
    shiftFulfillmentRate: 0.5 // デフォルト値
  }));
  
  // シフト生成結果
  const generatedShifts: ShiftEvent[] = [];
  
  // 各日付について処理
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // この日の営業時間を取得
    const dayBusinessHour = businessHours.find(bh => bh.dayOfWeek === dayOfWeek);
    if (!dayBusinessHour) {
      // 営業時間が設定されていない日は翌日へ
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // 営業時間の開始・終了時刻をパース
    const [openHour, openMinute] = dayBusinessHour.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = dayBusinessHour.closeTime.split(':').map(Number);
    
    const dayStartTime = new Date(currentDate);
    dayStartTime.setHours(openHour, openMinute, 0, 0);
    
    const dayEndTime = new Date(currentDate);
    dayEndTime.setHours(closeHour, closeMinute, 0, 0);
    
    // 時間帯を定義（朝・昼・夜）
    const totalHours = differenceInHours(dayEndTime, dayStartTime);
    const splitHours = Math.floor(totalHours / 3);
    
    const morningStart = dayStartTime;
    const afternoonStart = addHours(dayStartTime, splitHours);
    const eveningStart = addHours(dayStartTime, splitHours * 2);
    
    // この日の各時間帯の要件を取得
    const dayRequirements = staffRequirements.filter(req => req.dayOfWeek === dayOfWeek);
    
    // 時間帯ごとに処理
    const timeSlots = [
      { name: 'morning', start: morningStart, end: afternoonStart },
      { name: 'afternoon', start: afternoonStart, end: eveningStart },
      { name: 'evening', start: eveningStart, end: dayEndTime }
    ];
    
    timeSlots.forEach(slot => {
      // この時間帯の要件を取得
      const slotRequirement = dayRequirements.find(req => req.timeSlot === slot.name);
      if (!slotRequirement) return;
      
      // 必要な従業員数
      const requiredCount = slotRequirement.count;
      
      // ポジション別の必要人数
      const requiredPositions = slotRequirement.requiredPositions || { 'floor': requiredCount };
      
      // 各ポジションに従業員を割り当て
      Object.entries(requiredPositions).forEach(([position, positionCount]) => {
        // 候補となる従業員をスコア付けし並べ替え
        const candidates = workingEmployees.map(employee => {
          const score = calculateAssignmentScore(
            employee,
            currentDate,
            slot.start,
            slot.end,
            position,
            generatedShifts,
            employeeAvailability,
            config
          );
          
          return { employee, score };
        })
        .filter(item => item.score > -100) // 最低条件を満たしている従業員のみ
        .sort((a, b) => b.score - a.score); // スコア降順
        
        // 必要人数分だけ割り当て
        for (let i = 0; i < positionCount; i++) {
          if (i < candidates.length) {
            const { employee } = candidates[i];
            
            // シフトを生成
            const shiftId = `shift-${Date.now()}-${employee.id}-${slot.name}`;
            generatedShifts.push({
              id: shiftId,
              title: employee.name,
              start: slot.start.toISOString(),
              end: slot.end.toISOString(),
              employeeId: employee.id,
              employeeName: employee.name,
              position: position,
              color: getColorForPosition(position)
            });
            
            // 従業員の状態を更新
            const shiftHours = differenceInHours(slot.end, slot.start);
            employee.weeklyWorkHours = (employee.weeklyWorkHours || 0) + shiftHours;
            employee.weeklyShiftCount = (employee.weeklyShiftCount || 0) + 1;
            employee.lastAssignedDate = new Date(currentDate);
          }
        }
      });
    });
    
    // 週の最終日なら従業員の週間カウンタをリセット
    if (dayOfWeek === 6) { // 土曜日が週の最終日
      workingEmployees.forEach(emp => {
        emp.weeklyWorkHours = 0;
        emp.weeklyShiftCount = 0;
      });
    }
    
    // 翌日へ
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return generatedShifts;
}

/**
 * 役割に基づく色を取得
 */
function getColorForPosition(position?: string): string {
  switch (position) {
    case 'cashier': return '#4f46e5'; // インディゴ
    case 'floor': return '#0891b2';   // シアン
    case 'kitchen': return '#ca8a04'; // イエロー
    case 'manager': return '#be185d'; // ピンク
    default: return '#6b7280';        // グレー
  }
}

/**
 * 同じ日付かどうかを判定（時間は無視）
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
} 