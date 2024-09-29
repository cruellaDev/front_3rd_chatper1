import { NOTFOUND, ROUTES } from '../constants';
import { ErrorBoundaryPage } from '../components/ui';

/**
 * 컴포넌트 클래스 - 클래스 컴포넌트 프레임
 */
export class Component {
  $target;
  props;
  state;
  constructor($target, props) {
    this.$target = $target;
    this.props = props; // props 할당
    this.setup();
    this.setEvent();
    this.render();
  }
  setup() {}
  mounted() {}
  template() {
    return '';
  }
  render() {
    this.$target.innerHTML = this.template();
    this.mounted(); // render 후에 mounted가 실행 된다.
  }
  setEvent() {
    window.addEventListener('error', this.handleError); // 에러 핸들링
  }
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }
  addEvent(eventType, selector, callback) {
    const children = [...this.$target.querySelectorAll(selector)];
    this.$target.addEventListener(eventType, (event) => {
      if (!event.target.closest(selector)) return false;
      callback(event);
    });
  }
  // 에러 핸들링
  handleError(error) {
    const $root = document.getElementById('root');
    $root.innerHTML = ErrorBoundaryPage({ errMsg: error?.message }); // 에러바운더리 페이지 적용
  }
}

/**
 * 라우터
 */
export class Router {
  routes;
  errors;
  auths;
  params;
  constructor() {
    this.routes = {};
    this.errors = {};
    this.auths = {
      always: [],
      authenticated: [],
      notAuthenticated: [],
    };
    this.params = null;
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
  }

  navigateTo(path) {
    history.pushState(null, '', path);
    this.handleRoute(path);
  }

  getCurrentPath() {
    return window.location.pathname;
  }

  setError(path, handler) {
    this.errors[path] = handler;
  }

  isLocated(path) {
    const { pathname } = this.matchRoute(this.getCurrentPath()) || {};
    return path === pathname;
  }

  addAuths(always = [], authenticated = [], notAuthenticated = []) {
    this.auths.always = [...this.auths.always, ...always];
    this.auths.authenticated = [...this.auths.authenticated, ...authenticated];
    this.auths.notAuthenticated = [
      ...this.auths.notAuthenticated,
      ...notAuthenticated,
    ];
  }

  filterRoutesByAuth(isAuthenticated) {
    let routes = [];
    Object.entries(ROUTES).forEach(([key, value]) => {
      if (this.auths.always.includes(key)) routes.push(value);
      if (isAuthenticated) {
        if (this.auths.authenticated.includes(key)) routes.push(value);
      } else {
        if (this.auths.notAuthenticated.includes(key)) routes.push(value);
      }
    });
    return routes;
  }

  matchRoute(path) {
    return Object.entries(this.routes).reduce((acc, [route, handler]) => {
      if (acc) return acc;
      const routeRegex = route.replace(/:\w+/g, '([\\w-]+)');
      const regex = new RegExp(`^${routeRegex}$`);
      const match = path.match(regex);

      if (match) {
        const paramNames = (route.match(/:\w+/g) || []).map((name) =>
          name.substring(1)
        );
        const params = {};

        paramNames.forEach((param, index) => {
          params[param] = match[index + 1];
        });

        return {
          handler,
          pathname: route,
          params,
        };
      }

      return null;
    }, null);
  }

  handlePopState() {
    this.handleRoute(this.getCurrentPath());
  }

  handleRoute(path) {
    const matchResult = this.matchRoute(path);
    if (matchResult) {
      const { handler, params } = matchResult;
      this.params = params;
      handler(params);
    } else {
      const notFoundHandler = this.errors[NOTFOUND]?.path;
      if (notFoundHandler) {
        notFoundHandler();
      } else {
        console.error('404 Not Found');
      }
    }
  }
}

/**
 * 스토리지 클래스 - 스토리지 프레임
 */
class Storage {
  storage;
  constructor(storage) {
    this.storage = storage;
  }
  getItem(key) {
    /* 조회 */
  }
  setItem(key, data) {
    /* 저장 */
  }
  removeItem(key) {
    /* 삭제 */
  }
}

/**
 * 로컬 스토리지 클래스
 */
export class LocalStorage extends Storage {
  getItem(key) {
    return JSON.parse(this.storage.getItem(key));
  }
  setItem(key, data) {
    this.storage.setItem(key, JSON.stringify(data));
  }
  removeItem(key) {
    this.storage.removeItem(key);
  }
}
