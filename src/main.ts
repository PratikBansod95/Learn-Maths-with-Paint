import { App } from './ui/App';
import './styles/main.css';

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');

const app = new App(root);
void app.start();
