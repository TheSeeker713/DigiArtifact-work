import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { initStatsAggregator } from './lib/services/statsAggregator'

const app = mount(App, {
  target: document.getElementById('app')!,
})

void initStatsAggregator()

export default app
