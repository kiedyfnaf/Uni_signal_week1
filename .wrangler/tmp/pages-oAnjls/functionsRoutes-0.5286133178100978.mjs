import { onRequestPost as __api_manga__id__viewed_js_onRequestPost } from "/workspaces/Uni_signal_week1/functions/api/manga/[id]/viewed.js"
import { onRequestPost as __api_auth_login_js_onRequestPost } from "/workspaces/Uni_signal_week1/functions/api/auth/login.js"
import { onRequestPost as __api_auth_logout_js_onRequestPost } from "/workspaces/Uni_signal_week1/functions/api/auth/logout.js"
import { onRequestGet as __api_auth_me_js_onRequestGet } from "/workspaces/Uni_signal_week1/functions/api/auth/me.js"
import { onRequestPost as __api_auth_register_js_onRequestPost } from "/workspaces/Uni_signal_week1/functions/api/auth/register.js"
import { onRequestGet as __api_manga__id__js_onRequestGet } from "/workspaces/Uni_signal_week1/functions/api/manga/[id].js"
import { onRequestGet as __api_manga_index_js_onRequestGet } from "/workspaces/Uni_signal_week1/functions/api/manga/index.js"
import { onRequestPost as __api_manga_index_js_onRequestPost } from "/workspaces/Uni_signal_week1/functions/api/manga/index.js"

export const routes = [
    {
      routePath: "/api/manga/:id/viewed",
      mountPath: "/api/manga/:id",
      method: "POST",
      middlewares: [],
      modules: [__api_manga__id__viewed_js_onRequestPost],
    },
  {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestGet],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_js_onRequestPost],
    },
  {
      routePath: "/api/manga/:id",
      mountPath: "/api/manga",
      method: "GET",
      middlewares: [],
      modules: [__api_manga__id__js_onRequestGet],
    },
  {
      routePath: "/api/manga",
      mountPath: "/api/manga",
      method: "GET",
      middlewares: [],
      modules: [__api_manga_index_js_onRequestGet],
    },
  {
      routePath: "/api/manga",
      mountPath: "/api/manga",
      method: "POST",
      middlewares: [],
      modules: [__api_manga_index_js_onRequestPost],
    },
  ]