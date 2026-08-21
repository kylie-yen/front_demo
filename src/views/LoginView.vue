<template>
  <main class="login-page">
    <section class="login-showcase">
      <div class="login-brand">
        <div class="brand-mark brand-mark-light" aria-hidden="true"><span></span><span></span><span></span></div>
        <div><strong>路安智养</strong><span>Road Care Workroom</span></div>
      </div>
      <div class="showcase-copy">
        <span>城市道路主动养护协作平台</span>
        <h1>感知每一处隐患，<br />协同每一次养护。</h1>
        <p>融合众包感知、风险研判、巡检核验与维修闭环，让道路治理从被动响应走向主动预防。</p>
      </div>
      <div class="road-illustration" aria-hidden="true">
        <div class="city city-back"><i></i><i></i><i></i><i></i></div>
        <div class="city city-front"><i></i><i></i><i></i></div>
        <div class="road-path"><span></span><span></span><span></span></div>
        <div class="map-pin pin-one"></div><div class="map-pin pin-two"></div><div class="scan-pulse"></div>
      </div>
      <div class="showcase-stats">
        <div><strong>8</strong><span>条试点车道</span></div><div><strong>1.8 km²</strong><span>实时感知覆盖</span></div><div><strong>94.8%</strong><span>养护闭环率</span></div>
      </div>
    </section>

    <section class="login-form-side">
      <div class="login-form-wrap">
        <div class="login-heading"><span class="eyebrow">WELCOME BACK</span><h2>登录养护工作台</h2><p>使用你的业务账号继续</p></div>
        <el-form :model="loginForm" label-position="top" @submit.prevent="handleLogin" class="login-form">
          <el-form-item label="登录账号"><el-input v-model="loginForm.account" placeholder="请输入业务账号" size="large" /></el-form-item>
          <el-form-item label="登录密码"><el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password size="large" /></el-form-item>
          <div class="login-options"><el-checkbox v-model="rememberMe">记住登录状态</el-checkbox><button type="button">忘记密码？</button></div>
          <el-button type="primary" size="large" class="login-submit" :loading="loading" @click="handleLogin">进入工作台 <span aria-hidden="true">→</span></el-button>
        </el-form>
        <div class="demo-access">
          <span>演示身份快捷登录</span>
          <div><button v-for="account in demoAccounts" :key="account.id" type="button" @click="quickLogin(account.id)"><b>{{ account.initial }}</b><span><strong>{{ account.role }}</strong><small>{{ account.name }}</small></span></button></div>
        </div>
        <p class="login-footnote">2026 智慧城市竞赛 · 闵行区永德路试点</p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAppStore } from '../stores/appStore';

const router = useRouter();
const store = useAppStore();
const loading = ref(false);
const rememberMe = ref(true);
const loginForm = reactive({ account: 'admin', password: 'demo2026' });
const demoAccounts = [{ id: 'admin', initial: '管', role: '管理人员', name: '张明远' }, { id: 'inspector1', initial: '巡', role: '巡检班组', name: '李建国' }, { id: 'repair1', initial: '修', role: '维修班组', name: '王宏伟' }];

function login(account: string, delay = 320) {
  loading.value = true;
  window.setTimeout(() => { store.login(account); loading.value = false; ElMessage.success(`欢迎回来，${store.currentUser.name}`); router.push('/dashboard'); }, delay);
}
function handleLogin() { login(loginForm.account, 420); }
function quickLogin(account: string) { login(account); }
</script>
