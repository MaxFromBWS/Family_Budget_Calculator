// ES module: shared application state and constants

export const STORAGE_KEY = 'familyBudgetFinalV1';
export const THEME_KEY = 'familyBudgetFinalThemeV1';
export const AUTH_USERS_KEY = 'familyBudgetAuthUsersV1';
export const AUTH_SESSION_KEY = 'familyBudgetAuthSessionV1';
export const ONBOARDING_KEY = 'familyBudgetOnboardingSeenV1';

export const state = {
  editingExpenseId: null,
  editingDailyIncomeId: null,
  selectedDay: '',
  authMode: 'login',
  authState: {
    userLogin: null
  },
  appData: {
    settings: {
      selectedMonth: '',
      familyMembers: 1,
      defaultIncomePlan: 0,
      defaultExpensePlan: 0
    },
    incomes: [],
    expenses: [],
    dailyIncomes: [],
    categoryLimits: [],
    recurringRules: [],
    monthHistory: [],
    goals: [],
    reserveFund: {
      target: 0,
      current: 0,
      monthlyContribution: 0
    }
  }
};
