<template>
  <div class="w-screen h-screen flex items-center justify-center bg-[#F1F5F9] p-4 font-sans">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 flex flex-col gap-6">
      <!-- Top Title & Logo -->
      <div class="flex flex-col items-center text-center">
        <div class="w-12 h-12 rounded-xl bg-[#246BCE] flex items-center justify-center text-white shadow-xs mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        </div>
        <h1 class="text-lg font-bold text-slate-900 tracking-tight">道路微病害主动养护平台</h1>
        <p class="text-xs text-slate-400 mt-1">众包感知 · 风险评估 · 精准巡检 · 闭环维修</p>
      </div>

      <!-- Login Form -->
      <el-form :model="loginForm" label-position="top" @submit.prevent="handleLogin" class="flex flex-col gap-1">
        <el-form-item label="登录账号">
          <el-input
            v-model="loginForm.account"
            placeholder="请输入管理员或业务账号"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item label="登录密码">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入安全密码"
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <div class="flex items-center justify-between text-xs text-slate-600 my-1">
          <el-checkbox v-model="rememberMe">记住登录状态</el-checkbox>
          <span class="text-[#246BCE] cursor-pointer hover:underline">忘记密码？</span>
        </div>

        <el-button
          type="primary"
          size="large"
          class="w-full !rounded-xl !h-11 mt-2 text-sm font-semibold !bg-[#246BCE] hover:!bg-blue-700"
          :loading="loading"
          @click="handleLogin"
        >
          立即登录进入平台
        </el-button>
      </el-form>

      <!-- Quick Demo Account Shortcut -->
      <div class="pt-4 border-t border-slate-100 flex flex-col gap-2">
        <span class="text-xs font-semibold text-slate-500">演示账号快捷通道：</span>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            @click="quickLogin('admin')"
            class="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#246BCE] text-xs font-medium border border-slate-200 hover:border-blue-200 transition cursor-pointer flex flex-col items-center gap-0.5"
          >
            <span>管理人员</span>
            <span class="text-[10px] text-slate-400">张明远</span>
          </button>
          <button
            type="button"
            @click="quickLogin('inspector1')"
            class="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-[#18A57A] text-xs font-medium border border-slate-200 hover:border-emerald-200 transition cursor-pointer flex flex-col items-center gap-0.5"
          >
            <span>巡检班组</span>
            <span class="text-[10px] text-slate-400">李建军</span>
          </button>
          <button
            type="button"
            @click="quickLogin('repair1')"
            class="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-[#F27D26] text-xs font-medium border border-slate-200 hover:border-orange-200 transition cursor-pointer flex flex-col items-center gap-0.5"
          >
            <span>维修班组</span>
            <span class="text-[10px] text-slate-400">王宏伟</span>
          </button>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="text-center text-[11px] text-slate-400">
        闵行区永德路试点区 · 比赛验证展示版 (MVP)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import { Odometer } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const store = useAppStore();

const loading = ref(false);
const rememberMe = ref(true);

const loginForm = reactive({
  account: 'admin',
  password: '••••••••',
});

function handleLogin() {
  loading.value = true;
  setTimeout(() => {
    store.login(loginForm.account);
    loading.value = false;
    ElMessage.success(`欢迎回来，${store.currentUser.name}`);
    router.push('/dashboard');
  }, 400);
}

function quickLogin(account: string) {
  loading.value = true;
  setTimeout(() => {
    store.login(account);
    loading.value = false;
    ElMessage.success(`快捷登录成功：【${store.currentUser.role}】${store.currentUser.name}`);
    router.push('/dashboard');
  }, 300);
}
</script>
