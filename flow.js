const routes = [...document.querySelectorAll('.route')];
const source = document.querySelector('[data-stage="source"]');
const pipeline = document.querySelector('[data-stage="pipeline"]');
const infra = document.querySelector('[data-stage="infra"]');
const clouds = [...document.querySelectorAll('[data-cloud]')];
const percent = document.querySelector('[data-percent]');
const bar = document.querySelector('[data-bar]');
const eventText = document.querySelector('[data-event]');
const packets = [...document.querySelectorAll('.packet')];
let currentProgress = 0;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const segment = (progress, start, end) => clamp((progress - start) / (end - start));

function setStage(element, state, label) {
  element.classList.toggle('active', state === 'active');
  element.classList.toggle('complete', state === 'complete');
  element.querySelector('.status').textContent = label;
}

function placePacket(packet, route, progress) {
  const length = route.getTotalLength();
  const point = route.getPointAtLength(length * clamp(progress));
  packet.setAttribute('cx', point.x);
  packet.setAttribute('cy', point.y);
  packet.classList.toggle('moving', progress > 0 && progress < 1);
}

function render(progress, direction = 1) {
  currentProgress = clamp(progress);
  const sourceToPipeline = segment(currentProgress, 0.04, 0.3);
  const pipelineToInfra = segment(currentProgress, 0.3, 0.62);
  const infraToCloud = segment(currentProgress, 0.62, 0.96);
  const draws = [sourceToPipeline, pipelineToInfra, infraToCloud, infraToCloud, infraToCloud];
  routes.forEach((route, index) => {
    route.classList.add('active');
    route.style.setProperty('--draw', draws[index]);
  });
  placePacket(packets[0], routes[0], sourceToPipeline);
  placePacket(packets[1], routes[1], pipelineToInfra);

  if (currentProgress < .3) {
    setStage(source, 'active', direction > 0 ? 'pushing' : 'restored');
    setStage(pipeline, '', 'queued');
    setStage(infra, '', 'waiting');
    eventText.textContent = direction > 0 ? 'commit accepted from GitHub' : 'returning to source';
  } else if (currentProgress < .62) {
    setStage(source, 'complete', 'passed');
    setStage(pipeline, 'active', direction > 0 ? 'running' : 'reversing');
    setStage(infra, '', 'waiting');
    eventText.textContent = direction > 0 ? 'tests, scan and image build running' : 'pipeline rolling back';
  } else if (currentProgress < .9) {
    setStage(source, 'complete', 'passed');
    setStage(pipeline, 'complete', 'passed');
    setStage(infra, 'active', direction > 0 ? 'applying' : 'destroying');
    eventText.textContent = direction > 0 ? 'terraform applying cloud changes' : 'terraform reversing changes';
  } else {
    setStage(source, 'complete', 'passed');
    setStage(pipeline, 'complete', 'passed');
    setStage(infra, 'complete', 'applied');
    eventText.textContent = direction > 0 ? 'cloud workloads healthy' : 'cloud connections releasing';
  }
  clouds.forEach((cloud, index) => cloud.classList.toggle('active', infraToCloud > .35 + index * .16));
  percent.textContent = `${Math.round(currentProgress * 100)}%`;
  bar.style.setProperty('--progress', currentProgress);
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== window.parent) return;
  if (event.data?.type === 'pipeline-progress') render(Number(event.data.progress), Number(event.data.direction));
});

render(0);
