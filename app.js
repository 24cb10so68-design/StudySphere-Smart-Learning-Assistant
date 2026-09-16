const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const toast = (message) => {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  window.clearTimeout(window.toastTimer);
  window.toastTimer = window.setTimeout(() => element.classList.remove('show'), 2600);
};

const switchView = (target) => {
  const next = document.getElementById(target);
  if (!next) return;
  $$('.view').forEach(view => view.classList.toggle('active', view === next));
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.viewTarget === target));
  $('.sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

$$('[data-view-target]').forEach(control => control.addEventListener('click', event => {
  const target = control.dataset.viewTarget;
  if (control.tagName === 'A') event.preventDefault();
  switchView(target);
}));

$('#menuButton').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#themeButton').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  toast(document.body.classList.contains('dark') ? 'Night study mode is on.' : 'Day study mode is on.');
});
$('#notificationButton').addEventListener('click', () => toast('You’re all caught up — no new study reminders.'));
$('#profileButton').addEventListener('click', () => toast('Profile settings are ready for your next update.'));

const focusOverlay = $('#focusOverlay');
let focusSeconds = 25 * 60;
let focusTimer;
let focusRunning = true;
const updateFocus = () => {
  const minutes = String(Math.floor(focusSeconds / 60)).padStart(2, '0');
  const seconds = String(focusSeconds % 60).padStart(2, '0');
  $('#focusTime').textContent = `${minutes}:${seconds}`;
};
const stopFocus = () => { window.clearInterval(focusTimer); focusTimer = null; };
const startFocusSession = () => {
  focusSeconds = 25 * 60;
  updateFocus();
  focusOverlay.hidden = false;
  focusRunning = true;
  $('#pauseFocus').textContent = 'Pause';
  stopFocus();
  focusTimer = window.setInterval(() => {
    if (focusRunning && focusSeconds > 0) { focusSeconds -= 1; updateFocus(); }
    if (focusSeconds === 0) { stopFocus(); toast('Focus session complete — great work!'); }
  }, 1000);
};
$('#startFocus').addEventListener('click', startFocusSession);
$$('[data-close-overlay]').forEach(button => button.addEventListener('click', () => { focusOverlay.hidden = true; stopFocus(); }));
$('#pauseFocus').addEventListener('click', () => { focusRunning = !focusRunning; $('#pauseFocus').textContent = focusRunning ? 'Pause' : 'Resume'; });

const aiOverlay = $('#aiOverlay');
$$('[data-open-ai]').forEach(button => button.addEventListener('click', () => { aiOverlay.hidden = false; $('#aiInput').focus(); }));
$$('[data-close-ai]').forEach(button => button.addEventListener('click', () => aiOverlay.hidden = true));
$$('.prompt-chips button').forEach(button => button.addEventListener('click', () => { $('#aiInput').value = button.textContent; $('#aiInput').focus(); }));
$('#sendAi').addEventListener('click', () => {
  const prompt = $('#aiInput').value.trim();
  if (!prompt) { $('#aiInput').focus(); return; }
  const response = $('#aiResponse');
  response.hidden = false;
  response.textContent = `Here’s a focused way to approach “${prompt}”: start with the core idea, work through one example, then test yourself with three short questions. I’ve added the related topic to your adaptive revision queue.`;
});

const updateTaskCount = () => {
  const total = $$('#taskList input').length;
  const done = $$('#taskList input:checked').length;
  $('.plan-count').textContent = done === total ? 'All tasks complete' : `${total - done} task${total - done === 1 ? '' : 's'} left`;
};
const bindTaskInput = (input) => input.addEventListener('change', () => {
  const row = input.closest('.task-row');
  row.classList.toggle('done', input.checked);
  row.querySelector('em').textContent = input.checked ? 'Complete' : 'Planned';
  updateTaskCount();
  toast(input.checked ? 'Task complete — your plan has been updated.' : 'Task moved back into your plan.');
});
$$('#taskList input').forEach(bindTaskInput);
updateTaskCount();

const escapeHtml = (value) => value.replace(/[<>&]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[char]));
const taskOverlay = $('#taskOverlay');
$('#addTask').addEventListener('click', () => { taskOverlay.hidden = false; $('#taskTitle').focus(); });
$$('[data-close-task]').forEach(button => button.addEventListener('click', () => { taskOverlay.hidden = true; $('#taskForm').reset(); }));
$('#taskForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const title = $('#taskTitle').value.trim();
  const subject = $('#taskSubject').value;
  const minutes = $('#taskMinutes').value;
  if (!title) return;
  const task = document.createElement('label');
  task.className = 'task-row';
  task.innerHTML = `<input type="checkbox" /><span class="checkmark"></span><span><strong>${escapeHtml(title)}</strong><small>${subject} • ${minutes} min</small></span><em>Planned</em>`;
  $('#taskList').append(task);
  bindTaskInput($('input', task));
  updateTaskCount();
  taskOverlay.hidden = true;
  $('#taskForm').reset();
  toast(`${subject} task added to today’s plan.`);
});

const setupOverlay = $('#setupOverlay');
$('#setupExam').addEventListener('click', () => { setupOverlay.hidden = false; $('#examName').focus(); });
$$('[data-close-setup]').forEach(button => button.addEventListener('click', () => setupOverlay.hidden = true));
$('#setupForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#examName').value.trim() || 'Your exam';
  const date = new Date(`${$('#examDate').value}T12:00:00`);
  const today = new Date('2026-08-22T12:00:00');
  const days = Math.max(0, Math.ceil((date - today) / 86400000));
  $('#daysLeftSide').textContent = days;
  $('.exam-card p').textContent = `${name} in`;
  setupOverlay.hidden = true;
  toast('Exam goal saved — your plan has been recalculated.');
});

$('#studyMaterial').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;
  const extension = file.name.split('.').pop().toUpperCase().slice(0, 4);
  const row = document.createElement('div');
  row.className = 'material-row';
  row.innerHTML = `<span class="file-badge">${escapeHtml(extension)}</span><span><strong></strong><small>Analyzing topics…</small></span><em>Processing</em>`;
  $('strong', row).textContent = file.name;
  $('#materialList').prepend(row);
  $('#materialStatus').textContent = `${$('#materialList').children.length} files ready`;
  window.setTimeout(() => {
    $('small', row).textContent = '6 topics extracted';
    $('em', row).textContent = 'Ready';
    const topic = document.createElement('span');
    topic.textContent = 'New study topic';
    $('#topicTags').append(topic);
    toast('Material analyzed — 6 topics added to your workspace.');
  }, 700);
  event.target.value = '';
});
$('#reviewSyllabus').addEventListener('click', () => toast('All extracted topics are ready for review in your study plan.'));

const questions = [
  { question: 'Which reagent is used to convert an alcohol into an alkyl chloride?', answers: ['A. Dilute sulphuric acid', 'B. Thionyl chloride (SOCl₂)', 'C. Sodium hydroxide', 'D. Aqueous ammonia'], correct: 1 },
  { question: 'What is the major product when propene reacts with HBr in the absence of peroxide?', answers: ['A. 1-bromopropane', 'B. 2-bromopropane', 'C. Propan-1-ol', 'D. Propan-2-ol'], correct: 1 },
  { question: 'Which functional group is present in ethanoic acid?', answers: ['A. Aldehyde', 'B. Ketone', 'C. Carboxyl', 'D. Ester'], correct: 2 },
  { question: 'Which statement about a catalyst is correct?', answers: ['A. It is consumed in the reaction', 'B. It changes the equilibrium constant', 'C. It lowers activation energy', 'D. It increases enthalpy change'], correct: 2 },
  { question: 'Which product is formed by the oxidation of a primary alcohol?', answers: ['A. Alkene', 'B. Aldehyde', 'C. Ketone', 'D. Amine'], correct: 1 }
];
let currentQuestion = 0;
let selectedAnswer = null;
let checkedAnswer = false;
const drawQuestion = () => {
  const item = questions[currentQuestion];
  $('#questionText').textContent = item.question;
  $('#questionNumber').textContent = currentQuestion + 1;
  $('#quizProgress').style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  $('#answers').innerHTML = item.answers.map((answer, index) => `<button type="button" data-answer="${index}">${answer}</button>`).join('');
  $('#quizHint').textContent = 'Take your time — this affects your revision plan.';
  $('#nextQuestion').textContent = 'Check answer';
  $('#nextQuestion').disabled = true;
  selectedAnswer = null;
  checkedAnswer = false;
  $$('#answers button').forEach(button => button.addEventListener('click', () => {
    if (checkedAnswer) return;
    $$('#answers button').forEach(answer => answer.classList.remove('selected'));
    button.classList.add('selected');
    selectedAnswer = Number(button.dataset.answer);
    $('#nextQuestion').disabled = false;
  }));
};
$('#nextQuestion').addEventListener('click', () => {
  const item = questions[currentQuestion];
  if (!checkedAnswer) {
    checkedAnswer = true;
    $$('#answers button').forEach(button => {
      const index = Number(button.dataset.answer);
      if (index === item.correct) button.classList.add('correct');
      if (index === selectedAnswer && index !== item.correct) button.classList.add('wrong');
    });
    const correct = selectedAnswer === item.correct;
    $('#quizHint').textContent = correct ? 'Correct! Nice recall — keep going.' : 'Not quite. This question is saved for your next revision.';
    $('#nextQuestion').textContent = currentQuestion === questions.length - 1 ? 'Finish quiz' : 'Next question';
    if (!correct) toast('Saved this concept to your revision queue.');
  } else if (currentQuestion < questions.length - 1) { currentQuestion += 1; drawQuestion(); }
  else { $('#questionText').textContent = 'Quiz complete — great practice!'; $('#answers').innerHTML = '<div class="completion-message">Your quiz results have been added to your performance insights.</div>'; $('#nextQuestion').disabled = true; $('#quizHint').textContent = 'Your adaptive plan has been refreshed.'; toast('Quiz complete — readiness score updated.'); }
});
$('#startMock').addEventListener('click', () => toast('Mock test setup is ready. Start when you have 45 focused minutes.'));
$('#continueLearning').addEventListener('click', () => { toast('Lesson opened: first-order differential equations.'); });
$('#downloadReport').addEventListener('click', () => {
  const report = [
    'StudySphere — Weekly learning report',
    'Exam readiness: 68%',
    'Focus time: 14h 25m',
    'Questions solved: 276',
    'Strong topics: Electrostatics, Human reproduction',
    'Revision priority: Organic reactions, Differential equations'
  ].join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([report], { type: 'text/plain' }));
  link.download = 'studysphere-weekly-report.txt';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  toast('Weekly learning report downloaded.');
});

$$('.focus-overlay, .ai-overlay, .form-overlay').forEach(overlay => overlay.addEventListener('click', (event) => {
  if (event.target !== overlay) return;
  overlay.hidden = true;
  if (overlay === focusOverlay) stopFocus();
}));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { aiOverlay.hidden = true; focusOverlay.hidden = true; taskOverlay.hidden = true; setupOverlay.hidden = true; stopFocus(); } });
drawQuestion();
