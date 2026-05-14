import './style.css';
import { startRouter } from './router.js';
import * as indexView from './views/index-view.js';
import * as workView from './views/work-view.js';
import * as inquireView from './views/inquire-view.js';

const container = document.getElementById('app');
startRouter({ container, views: { index: indexView, work: workView, inquire: inquireView } });
