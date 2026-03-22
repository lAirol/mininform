/**
 * Форма «Учредитель — физическое лицо»: добавление нескольких карточек,
 * data-path founders_phys.0.*, founders_phys.0.founders_phys.0.* для сборки JSON через buildJsonFromForm().
 */
const physical_person_founder = function () {
    const CONTAINER_ID = 'physical-person-founders-container';
    const JSUR_CONTAINER_ID = 'jur-person-founders-container';
    const ADD_BUTTON_SELECTOR = '[data-add-physical-founder]';
    const BASE_PATH = 'founders_phys';
    const FILLER_LIST = document.getElementById("filler_2_2_list");

    const getContainer = () => document.getElementById(CONTAINER_ID);
    const getJurContainer = () => document.getElementById(JSUR_CONTAINER_ID);

    // Сохраняем значения полей (и checked для radio/checkbox), а не DOM.
    // Это убирает проблему, когда после restore пропадают значения select.
    const savedStates = new WeakMap();

    function snapshotSaved(card) {
        const idx = card.getAttribute('data-physical-person-index');
        const basePrefix = `${BASE_PATH}.${idx}.`;
        const state = { values: {}, radios: {}, checks: {} };

        card.querySelectorAll('[data-path]').forEach((el) => {
            const path = el.getAttribute('data-path');
            if (!path || !path.startsWith(basePrefix)) return;
            const relKey = path.slice(basePrefix.length);

            if (el.type === 'radio') {
                if (el.checked) state.radios[relKey] = el.value;
                return;
            }

            if (el.type === 'checkbox') {
                state.checks[relKey] = !!el.checked;
                return;
            }

            state.values[relKey] = el.value;
        });

        savedStates.set(card, state);
    }

    function restoreSaved(card) {
        const state = savedStates.get(card);
        if (!state) {
            toggleState(card, 'saved');
            updateComplianceState(card);
            clearValidationUI(card);
            clearFieldError(document.getElementById('err_block'));
            return;
        }

        const idx = card.getAttribute('data-physical-person-index');
        const basePrefix = `${BASE_PATH}.${idx}.`;

        card.querySelectorAll('[data-path]').forEach((el) => {
            const path = el.getAttribute('data-path');
            if (!path || !path.startsWith(basePrefix)) return;
            const relKey = path.slice(basePrefix.length);

            if (el.type === 'radio') {
                if (Object.prototype.hasOwnProperty.call(state.radios, relKey)) {
                    el.checked = el.value === state.radios[relKey];
                }
                return;
            }

            if (el.type === 'checkbox') {
                if (Object.prototype.hasOwnProperty.call(state.checks, relKey)) {
                    el.checked = !!state.checks[relKey];
                }
                return;
            }

            if (Object.prototype.hasOwnProperty.call(state.values, relKey)) {
                el.value = state.values[relKey] ?? '';
            }
        });

        toggleState(card, 'saved');
        updateComplianceState(card);
        clearValidationUI(card);
        clearFieldError(document.getElementById('err_block'));
    }

    function reindexPhysicalCardNode(cardNode, newIndex) {
        if (!cardNode) return;

        cardNode.setAttribute('data-physical-person-index', newIndex);
        const p = `${BASE_PATH}.${newIndex}`;

        cardNode.querySelectorAll('[data-path]').forEach(el => {
            const path = el.getAttribute('data-path');
            if (!path) return;
            const fieldName = path.split('.').pop();
            el.setAttribute('data-path', `${p}.${fieldName}`);
        });

        cardNode.querySelectorAll('input[type="radio"]').forEach(radio => {
            const name = radio.getAttribute('name');
            if (name && name.startsWith('pp')) {
                const suffix = name.split('_').pop();
                radio.setAttribute('name', `pp${newIndex}_${suffix}`);
            }
        });
    }

    function buildFormCard(index) {
        const p = `${BASE_PATH}.${index}`;
        return `
            <div class="form-add-founder card card-physical-founder" data-physical-person-index="${index}" data-state="editing" data-is-new="1">
                <div class="founder-preview" style="display: none;">
                    <div class="founder-preview-info">
                        <span class="founder-icon">👤</span>
                        <span class="founder-name-text">Новый учредитель</span>
                    </div>
                    <div class="founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать" aria-label="Редактировать">✏️</button>
                        <button type="button" class="button_remove_founder" title="Удалить" aria-label="Удалить">✕</button>
                    </div>
                </div>

                <div class="founder-form-content">
                    <h4 class="physical-founder-title">Добавление учредителя СМИ – физическое лицо</h4>

                    <div class="full-width">
                        <label>Ф.И.О.</label>
                        <input type="text" data-path="${p}.fullName" placeholder="Фамилия, имя, отчество" required data-required="true">
                        <input type="hidden" data-path="${p}.typeFace" value="fizFace">
                    </div>

                    <div class="field-row">
                        <div class="field">
                            <label>Гражданство:</label>
                            <select data-path="${p}.citizenship" required>
                                <option value=""></option>
                                <option value="Республика Беларусь">Республика Беларусь</option>
                                <option value="Российская Федерация">Российская Федерация</option>
                                <option value="Латвия">Латвия</option>
                                <option value="Литва">Литва</option>
                                <option value="Эстония">Эстония</option>
                                <option value="Польша">Польша</option>
                            </select>
                        </div>
                    </div>

                    <div class="full-width">
                        <label>Адрес</label>
                        <textarea data-path="${p}.address" required></textarea>
                    </div>

                    <p class="subtitle">Контактные данные:</p>
                    <div class="contact-row">
                        <div><label>Код</label><input type="tel" data-path="${p}.phoneCode" data-validate="phoneCode" required></div>
                        <div><label>Телефон</label><input type="tel" data-path="${p}.phone" data-validate="phone" required></div>
                        <div><label>Факс</label><input type="text" data-path="${p}.fax"></div>
                        <div><label>Email</label><input type="email" data-path="${p}.email" data-validate="email" required></div>
                    </div>

                    <div class="compliance-section">
                        <h3>Выберите ответ для каждого пункта:</h3>
                        <div class="compliance-item">
                            <div class="radios">
                                <label><input type="radio" name="pp${index}_punishment" value="true" data-path="${p}.isServingSentence"> да</label>
                                <label><input type="radio" name="pp${index}_punishment" value="false" data-path="${p}.isServingSentence" checked> нет</label>
                                <div class="question">Отбываю наказание по приговору суда</div>
                            </div>
                        </div>
                        <div class="compliance-item">
                            <div class="radios">
                                <label><input type="radio" name="pp${index}_incapable" value="true" data-path="${p}.isIncapacitated"> да</label>
                                <label><input type="radio" name="pp${index}_incapable" value="false" data-path="${p}.isIncapacitated" checked> нет</label>
                                <div class="question">Признан решением суда недееспособным</div>
                            </div>
                        </div>
                        <div class="compliance-item">
                            <div class="radios">
                                <label><input type="radio" name="pp${index}_revocation" value="true" data-path="${p}.isDeprivedOfMediaRights"> да</label>
                                <label><input type="radio" name="pp${index}_revocation" value="false" data-path="${p}.isDeprivedOfMediaRights" checked> нет</label>
                                <div class="question">Лишен в установленном порядке права заниматься деятельностью, связанной с производством и выпуском</div>
                            </div>
                        </div>
                        <div class="compliance-item">
                            <div class="radios">
                                <label><input type="radio" name="pp${index}_threeyears" value="true" data-path="${p}.isMediaTerminated"> да</label>
                                <label><input type="radio" name="pp${index}_threeyears" value="false" data-path="${p}.isMediaTerminated" checked> нет</label>
                                <div class="question">На момент регистрации СМИ не прошло трех лет со дня прекращения выпуска СМИ, учредителем которого являлся</div>
                            </div>
                        </div>
                        <div class="compliance-warning" aria-live="polite" style="display:none;color:#b00020;margin-top:10px;"></div>
                    </div>

                    <div class="form-footer-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                        <button type="button" class="btn-save-founder">Добавить учредителя сми</button>
                        <button type="button" class="btn-cancel-founder">Отменить</button>
                    </div>
                </div>
            </div>`;
    }

    function validateFounderForm(card) {
        const fields = card.querySelectorAll('[data-path]');
        let isValid = true;
        
        fields.forEach(field => {
            if (typeof window.validateField === 'function') {
                if (!window.validateField(field)) isValid = false;
            } else {
                if (field.hasAttribute('required') && !field.value.trim()) {
                    field.classList.add('input-error');
                    isValid = false;
                }
            }
        });
        return isValid;
    }

    function toggleState(card, state) {
        const preview = card.querySelector('.founder-preview');
        const form = card.querySelector('.founder-form-content');
        const nameInput = card.querySelector('[data-path$=".fullName"]');
        const nameDisplay = card.querySelector('.founder-name-text');

        if (state === 'saved') {
            nameDisplay.textContent = nameInput.value || "Без имени";
            preview.style.display = 'flex';
            form.style.display = 'none';
            card.setAttribute('data-state', 'saved');
        } else {
            preview.style.display = 'none';
            form.style.display = 'block';
            card.setAttribute('data-state', 'editing');
        }
    }

    function reindexContainer() {
        const container = getContainer();
        if (!container) return;
        const cards = container.querySelectorAll('.card-physical-founder');
        if (cards.length === 0) {
            if (FILLER_LIST) FILLER_LIST.style.display = 'block';
        }
        cards.forEach((card, newIndex) => {
            reindexPhysicalCardNode(card, newIndex);
        });
    }

    function updateComplianceState(card) {
        if (!card) return;
        const yesRadios = card.querySelectorAll('.compliance-section input[type="radio"][value="true"]');
        let hasAnyYes = false;
        yesRadios.forEach(radio => {
            if (radio.checked) hasAnyYes = true;
        });

        const saveBtn = card.querySelector('.btn-save-founder');
        const warningEl = card.querySelector('.compliance-warning');

        if (saveBtn) {
            saveBtn.disabled = hasAnyYes;
        }
        if (warningEl) {
            if (hasAnyYes) {
                warningEl.style.display = 'block';
                warningEl.textContent = 'Нельзя добавить учредителя: по указанным ограничениям все ответы должны быть «нет».';
            } else {
                warningEl.style.display = 'none';
                warningEl.textContent = '';
            }
        }
    }

    function init() {
        const container = getContainer();
        const addButtons = document.querySelectorAll(ADD_BUTTON_SELECTOR);

        addButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = container.querySelectorAll('.card-physical-founder').length;
                if (FILLER_LIST) FILLER_LIST.style.display = 'none';
                container.insertAdjacentHTML('beforeend', buildFormCard(index));
                const newCard = container.querySelector(`.card-physical-founder[data-physical-person-index="${index}"]`);
                if (newCard) {
                    updateComplianceState(newCard);
                }
                clearFieldError(document.getElementById('err_block'));
            });
        });

        document.addEventListener('click', (e) => {
            const target = e.target;
            const card = target.closest('.card-physical-founder');

            if (!card) return;

            if (target.classList.contains('btn-save-founder')) {
                updateComplianceState(card);
                if (card.querySelector('.btn-save-founder')?.disabled) {
                    return;
                }
                if (validateFounderForm(card)) {
                    toggleState(card, 'saved');
                    card.dataset.isNew = '0';
                    snapshotSaved(card);
                    FILLER_LIST.style.display = 'none';
                    clearFieldError(document.getElementById('err_block'));
                    let elem = card.querySelector('.physical-founder-title');
                    if (elem) {
                        elem.innerText = "Редактированое учредителя СМИ – физическое лицо";
                    }
                    let bnt = card.querySelector('.btn-save-founder');
                    if(bnt){
                        bnt.innerText = "Редактировать учредителя сми";
                    }
                } else {
                    card.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

            if (target.classList.contains('btn-cancel-founder')) {
                if (card.dataset.isNew === '1') {
                    card.remove();
                    checkContainersAndReindex();
                } else {
                    restoreSaved(card);
                }
            }

            if (target.closest('.button_edit_founder')) {
                toggleState(card, 'editing');
            }

            if (target.closest('.button_remove_founder')) {
                card.remove();
                checkContainersAndReindex();
            }
        });

        document.addEventListener('change', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;
            if (target.type === 'radio' && target.closest('.card-physical-founder') && target.closest('.compliance-section')) {
                const card = target.closest('.card-physical-founder');
                updateComplianceState(card);
            }
        });
    }

    
    function checkContainersAndReindex() {
        reindexContainer();
        const physCards = getContainer()?.querySelectorAll('.card-physical-founder').length || 0;
        const jurCards = getJurContainer()?.querySelectorAll('.card-jur-founder').length || 0;
    
        if (physCards === 0 && jurCards === 0) {
            FILLER_LIST.style.display = 'block';
        }else {
            FILLER_LIST.style.display = 'none';
        }
    }
    init();
};

physical_person_founder();

/**
 * Форма «Учредитель — юридическое лицо»: вложенная структура учредителей,
 * data-path founders.0.*, founders.0.founders.0.* для сборки JSON через buildJsonFromForm().
 */
const jur_person_founder = function () {
    const CONTAINER_ID = 'jur-person-founders-container';
    const PHYS_CONTAINER_ID = 'physical-person-founders-container';
    const ADD_BUTTON_SELECTOR = '[data-add-jur-founder]';
    const BASE_PATH = 'founders';
    const FILLER_LIST = document.getElementById("filler_2_2_list");
    const STATE_ORG_ICON = '🏛️';
    const JUR_ICON = '💼';

    const savedStates = new WeakMap();

    function snapshotSaved(card) {
        const basePrefix = `${card.getAttribute('data-parent-path')}.`;
        const state = { values: {}, radios: {}, checks: {}, nested: [] };

        card.querySelectorAll('[data-path]').forEach((el) => {
            const path = el.getAttribute('data-path');
            if (!path || !path.startsWith(basePrefix)) return;
            const relKey = path.slice(basePrefix.length);

            if (el.type === 'radio') {
                if (el.checked) state.radios[relKey] = el.value;
                return;
            }

            if (el.type === 'checkbox') {
                state.checks[relKey] = !!el.checked;
                return;
            }

            state.values[relKey] = el.value;
        });

        const nestedItems = card.querySelectorAll('.nested-founder-item');
        nestedItems.forEach((item) => {
            const founderPathAbs = item.getAttribute('data-founder-path');
            if (!founderPathAbs || !founderPathAbs.startsWith(basePrefix.replace(/\.$/, ''))) return;

            const m = founderPathAbs.match(/^(.*)\.founders\.(\d+)$/);
            if (!m) return;

            const parentPathAbs = m[1];
            const index = parseInt(m[2], 10);
            const type = item.classList.contains('nested-founder-jur') ? 'jur' : 'fiz';

            const depth = (founderPathAbs.match(/\.founders\.\d+/g) || []).length;

            state.nested.push({ parentPathAbs, index, type, depth });
        });

        savedStates.set(card, state);
    }

    function restoreSaved(card) {
        const state = savedStates.get(card);
        if (!state) {
            toggleState(card, 'saved');
            clearValidationUI(card);
            clearFieldError(document.getElementById('err_block'));
            return;
        }

        const rootParentPathAbs = card.getAttribute('data-parent-path');
        const basePrefix = `${rootParentPathAbs}.`;

        const listContainers = card.querySelectorAll('.nested-founders-list');
        listContainers.forEach((listEl) => {
            listEl.innerHTML = '';
        });

        const orderedNested = [...state.nested].sort((a, b) => a.depth - b.depth);
        orderedNested.forEach((rec) => {
            const listEl = card.querySelector(`.nested-founders-list[data-owner-path="${rec.parentPathAbs}"]`);
            if (!listEl) return;
            listEl.insertAdjacentHTML('beforeend', buildNestedItem(rec.parentPathAbs, rec.index, rec.type));
        });

        card.querySelectorAll('[data-path]').forEach((el) => {
            const path = el.getAttribute('data-path');
            if (!path || !path.startsWith(basePrefix)) return;
            const relKey = path.slice(basePrefix.length);

            if (el.type === 'radio') {
                if (Object.prototype.hasOwnProperty.call(state.radios, relKey)) {
                    el.checked = el.value === state.radios[relKey];
                }
                return;
            }

            if (el.type === 'checkbox') {
                if (Object.prototype.hasOwnProperty.call(state.checks, relKey)) {
                    el.checked = !!state.checks[relKey];
                }
                return;
            }

            if (Object.prototype.hasOwnProperty.call(state.values, relKey)) {
                el.value = state.values[relKey] ?? '';
            }
        });

        card.querySelectorAll('.nested-founder-item').forEach((node) => {
            const v = readNestedFounderValues(node);
            if (v) applyNestedFounderData(node, v);
        });

        toggleState(card, 'saved');

        card.querySelectorAll('.nested-founders-block').forEach((block) => {
            updateSum(block);
        });

        clearValidationUI(card);
        clearFieldError(document.getElementById('err_block'));
    }

    const COUNTRY_OPTIONS = `
        <option value="" selected disabled hidden></option>
        <option>Республика Беларусь</option>
        <option>Российская Федерация</option>
        <option>Латвия</option>
        <option>Литва</option>
        <option>Эстония</option>
        <option>Польша</option>
    `;

    const getContainer = () => document.getElementById(CONTAINER_ID);
    const getPhysContainer = () => document.getElementById(PHYS_CONTAINER_ID);

    function getBlockElements(block) {
        const path = block.getAttribute('data-parent-path');
        return {
            list: block.querySelector(`.nested-founders-list[data-owner-path="${path}"]`),
            sumEl: block.querySelector(`.founders-sum[data-owner-path="${path}"]`)
        };
    }


    function ensureNestedFounderDialogStyle() {
        if (document.getElementById('nested-founder-dialog-style')) return;
        const style = document.createElement('style');
        style.id = 'nested-founder-dialog-style';
        style.textContent = `
            .nested-founder-dialog-overlay {
                position: fixed;
                inset: 0;
                background: rgba(20, 22, 26, 0.45);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
            }
            .nested-founder-dialog {
                width: min(920px, 100%);
                max-height: calc(100vh - 40px);
                overflow: auto;
                background: #fff;
                border-radius: 12px;
                padding: 18px 18px 14px;
                box-shadow: 0 18px 45px rgba(0, 0, 0, 0.18);
            }
            .nested-founder-dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                margin-bottom: 10px;
            }
            .nested-founder-dialog-close {
                width: 30px;
                height: 30px;
                border-radius: 8px;
                border: 1px solid #d0d7de;
                background: #fff;
                color: #4b5563;
                font-size: 18px;
                line-height: 1;
                padding: 0;
            }
            .nested-founder-preview {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 8px;
            }
            .nested-founder-preview-main {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
            }
            .nested-founder-preview-actions {
                display: inline-flex;
                gap: 8px;
            }
            .nested-founder-preview-actions button {
                width: 28px;
                height: 28px;
                border-radius: 8px;
                background: #fff;
                color: #4b5563;
                border: 1px solid #d1d5db;
                padding: 0;
                line-height: 1;
            }
        `;
        document.head.appendChild(style);
    }

    function upsertHiddenField(item, path, value) {
        let input = item.querySelector(`input[type="hidden"][data-path="${path}"]`);
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.setAttribute('data-path', path);
            item.appendChild(input);
        }
        input.value = value ?? '';
    }

    function readNestedFounderValues(item) {
        const path = item.getAttribute('data-founder-path');
        if (!path) return null;
        const read = (key) => item.querySelector(`[data-path="${path}.${key}"]`)?.value ?? '';
        return {
            name: read('name'),
            country: read('country'),
            capitalPercent: read('capitalPercent'),
            isState: read('isState') === 'true'
        };
    }

    function applyNestedFounderData(item, values) {
        const path = item.getAttribute('data-founder-path');
        if (!path) return;

        upsertHiddenField(item, `${path}.name`, values.name ?? '');
        upsertHiddenField(item, `${path}.country`, values.country ?? '');
        upsertHiddenField(item, `${path}.capitalPercent`, values.capitalPercent ?? '');
        if (item.classList.contains('nested-founder-jur')) {
            upsertHiddenField(item, `${path}.isState`, values.isState ? 'true' : 'false');
        }

        const nameEl = item.querySelector('.nested-founder-name');
        const percentEl = item.querySelector('.nested-founder-percent');
        const iconEl = item.querySelector('.nested-founder-icon');
        if (nameEl) nameEl.textContent = values.name?.trim() || 'Без имени';
        if (percentEl) {
            percentEl.textContent = values.capitalPercent?.toString().trim() !== ''
                ? `${values.capitalPercent}%` : '';
        }

        if (item.classList.contains('nested-founder-jur')) {
            const isState = !!values.isState;
            if (iconEl) iconEl.textContent = isState ? STATE_ORG_ICON : JUR_ICON;
            const innerBlock = item.querySelector(':scope > .nested-founder-fields > .nested-founders-block');
            if (innerBlock) {
                if (isState) {
                    innerBlock.style.display = 'none';
                    innerBlock.setAttribute('data-ignore-container', '1');
                } else {
                    innerBlock.style.display = '';
                    innerBlock.removeAttribute('data-ignore-container');
                }
            }
        }
    }

    function openNestedFounderDialog({ type, parentPath, item }) {
        ensureNestedFounderDialogStyle();
        const isJur = type === 'jur';
        const values = item ? readNestedFounderValues(item) : { name: '', country: '', capitalPercent: '', isState: false };

        const overlay = document.createElement('div');
        overlay.className = 'nested-founder-dialog-overlay';
        overlay.innerHTML = `
            <div class="nested-founder-dialog" role="dialog" aria-modal="true">
                <div class="nested-founder-dialog-header">
                    <h4 style="margin:0;">${item ? 'Редактирование' : 'Добавление'} учредителя СМИ - ${isJur ? 'юридического лица' : 'физического лица'}</h4>
                    <button type="button" class="nested-founder-dialog-close" aria-label="Закрыть">×</button>
                </div>
                ${isJur ? `
                <p class="subtitle">Является ли государственным органом (организацией)</p>
                <div class="inline-options" style="margin-top:0;">
                    <label><input type="radio" name="nested_jur_state_dialog" value="true" ${values.isState ? 'checked' : ''}> да</label>
                    <label><input type="radio" name="nested_jur_state_dialog" value="false" ${values.isState ? '' : 'checked'}> нет</label>
                </div>` : ''}
                <div class="full-width">
                    <label>${isJur ? 'Полное наименование юридического лица' : 'Фамилия, имя, отчество'}</label>
                    <input type="text" class="nested-dialog-name" value="${values.name || ''}" required>
                </div>
                <div class="row">
                    <div class="field">
                        <label>${isJur ? 'Резидент какой страны' : 'Гражданство'}</label>
                        <select class="nested-dialog-country" required>${COUNTRY_OPTIONS}</select>
                    </div>
                    <div class="field field--short">
                        <label>Доля в уставном фонде, %</label>
                        <input type="number" step="0.01" class="nested-dialog-percent" value="${values.capitalPercent || ''}" required>
                    </div>
                </div>
                <div class="form-footer-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="btn-save-founder nested-dialog-save">Сохранить</button>
                    <button type="button" class="btn-cancel-founder nested-dialog-cancel">Отменить</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        const countryEl = overlay.querySelector('.nested-dialog-country');
        if (countryEl) countryEl.value = values.country || '';

        const close = () => overlay.remove();
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        overlay.querySelector('.nested-founder-dialog-close')?.addEventListener('click', close);
        overlay.querySelector('.nested-dialog-cancel')?.addEventListener('click', close);

        overlay.querySelector('.nested-dialog-save')?.addEventListener('click', () => {
            const nameInput = overlay.querySelector('.nested-dialog-name');
            const countryInput = overlay.querySelector('.nested-dialog-country');
            const percentInput = overlay.querySelector('.nested-dialog-percent');
            const next = {
                name: nameInput?.value?.trim() || '',
                country: countryInput?.value || '',
                capitalPercent: percentInput?.value || '',
                isState: !!overlay.querySelector('input[name="nested_jur_state_dialog"][value="true"]')?.checked
            };

            let hasError = false;
            [nameInput, countryInput, percentInput].forEach((field) => {
                if (!field) return;
                const invalid = !field.value || !String(field.value).trim();
                field.classList.toggle('input-error', invalid);
                if (invalid) hasError = true;
            });
            if (hasError) return;

            if (item) {
                applyNestedFounderData(item, next);
                const parentBlock = item.closest('.nested-founders-block');
                if (parentBlock) updateSum(parentBlock);
            } else {
                const ownerCard = document.querySelector(`.card-jur-founder [data-parent-path="${parentPath}"]`)?.closest('.card-jur-founder')
                    || document.querySelector(`.card-jur-founder[data-parent-path="${parentPath.split('.founders.')[0]}"]`);
                const block = ownerCard?.querySelector(`.nested-founders-block[data-parent-path="${parentPath}"]`) || document.querySelector(`.nested-founders-block[data-parent-path="${parentPath}"]`);
                const list = block ? getBlockElements(block).list : null;
                if (!block || !list) return;
                const index = list.querySelectorAll(':scope > .nested-founder-item').length;
                list.insertAdjacentHTML('beforeend', buildNestedItem(parentPath, index, type));
                const addedItem = list.querySelector(':scope > .nested-founder-item:last-child');
                if (addedItem) applyNestedFounderData(addedItem, next);
                updateSum(block);
            }

            close();
        });
    }

    function buildNestedItem(parentPath, index, type) {
        const path = `${parentPath}.founders.${index}`;
        const isJur = type === 'jur';

        return `
            <div class="nested-founder-item ${isJur ? 'nested-founder-jur' : 'nested-founder-fiz'}" data-founder-path="${path}">
                <div class="nested-founder-preview">
                    <div class="nested-founder-preview-main">
                        <span class="nested-founder-percent"></span>
                        <span class="nested-founder-icon ${isJur ? 'nested-founder-icon--jur' : 'nested-founder-icon--fiz'}" title="${isJur ? 'Юр. лицо' : 'Физ. лицо'}">
                            ${isJur ? JUR_ICON : '👤'}
                        </span>
                        <span class="nested-founder-name">Новый учредитель</span>
                    </div>
                    <div class="nested-founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать" aria-label="Редактировать" data-nested-founder-edit>✏️</button>
                        <button type="button" class="button_remove_founder" title="Удалить" aria-label="Удалить" data-nested-founder-remove>✕</button>
                    </div>
                </div>
                <div class="nested-founder-fields">
                    <input type="hidden" data-path="${path}.typeFace" value="${isJur ? 'jurFace' : 'fizFace'}">
                    <input type="hidden" data-path="${path}.name" value="">
                    <input type="hidden" data-path="${path}.country" value="">
                    <input type="hidden" data-path="${path}.capitalPercent" class="founder-capital-percent" value="">
                    ${isJur ? `<input type="hidden" data-path="${path}.isState" value="false">` : ''}
                    ${isJur ? `
                    <div class="nested-founders-block" data-parent-path="${path}">
                        <p class="nested-founders-title">УЧРЕДИТЕЛИ УКАЗАННОГО ЮРИДИЧЕСКОГО ЛИЦА:</p>
                        <div class="nested-founders-list" data-owner-path="${path}"></div>
                        <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${path}">
                            <span class="founders-sum-text">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</span>
                            <div class="nested-founders-actions">
                                <button type="button" class="button_add_nested" data-add-nested-jur>+ Юр. лицо</button>
                                <button type="button" class="button_add_nested" data-add-nested-fiz>+ Физ. лицо</button>
                            </div>
                        </div>
                    </div>` : ''}
                </div>
            </div>`;
    }

    function buildFormCard(index) {
        const p = `${BASE_PATH}.${index}`;
        return `
            <div class="form-add-founder card card-jur-founder" data-jur-person-index="${index}" data-parent-path="${p}" data-state="editing" data-is-new="1">
                <div class="founder-preview" style="display: none;">
                    <div class="founder-preview-info">
                        <span class="founder-icon">💼</span>
                        <span class="founder-name-text">Новый учредитель</span>
                    </div>
                    <div class="founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать" aria-label="Редактировать">✏️</button>
                        <button type="button" class="button_remove_founder" title="Удалить" aria-label="Удалить">✕</button>
                    </div>
                </div>

                <div class="founder-form-content">
                    <h4 class="jur-founder-title">Добавление учредителя СМИ – юридическое лицо</h4>
                    <input type="hidden" data-path="${p}.typeFace" value="jurFace">
                    
                    <p class="subtitle">Является ли государственным органом?</p>
                    <div class="inline-options">
                        <label><input type="radio" name="jurState${index}" value="true" data-path="${p}.isState"> Да</label>
                        <label><input type="radio" name="jurState${index}" value="false" data-path="${p}.isState" checked> Нет</label>
                    </div>

                    <div class="full-width">
                        <label>Полное наименование:</label>
                        <input type="text" data-path="${p}.name" required>
                    </div>

                    <div class="row">
                        <div class="field"><label>Страна:</label><select data-path="${p}.country" required>${COUNTRY_OPTIONS}</select></div>
                        <div class="field field--short">
                        <label>Доля иностранного участия в уставном фонде, %</label>
                        <input type="number"  step="0.01" data-path="${p}.capitalPercent" class="founder-capital-percent" 
                        inputmode="numeric" data-validate="percent" data-max-percent="20" required></div>
                    </div>

                    <div class="full-width">
                        <label>Адрес (полный):</label>
                        <input type="text" data-path="${p}.address" required>
                    </div>

                    <div class="contact-row">
                        <div><label>Код</label><input type="tel" data-path="${p}.phoneCode" data-validate="phoneCode" required></div>
                        <div><label>Телефон</label><input type="tel" data-path="${p}.phone" data-validate="phone" required></div>
                        <div><label>Факс</label><input type="text" data-path="${p}.fax"></div>
                        <div><label>Email</label><input type="email" data-path="${p}.email" data-validate="email" required></div>
                    </div>

                    <div class="nested-founders-block jur-founders-inner" data-parent-path="${p}">
                        <p class="nested-founders-title">УЧРЕДИТЕЛИ УКАЗАННОГО ЮРИДИЧЕСКОГО ЛИЦА:</p>
                        <div class="nested-founders-list" data-owner-path="${p}"></div>
                        <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${p}">
                            <span class="founders-sum-text">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</span>
                            <div class="nested-founders-actions">
                                <button type="button" class="button_add_nested" data-add-nested-jur>+ Юр. лицо</button>
                                <button type="button" class="button_add_nested" data-add-nested-fiz>+ Физ. лицо</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-footer-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                        <button type="button" class="btn-save-founder">Сохранить</button>
                        <button type="button" class="btn-cancel-founder">Отменить</button>
                    </div>
                </div>
            </div>`;
    }

    function validateFounderForm(card) {
        if (card.classList.contains('card-jur-founder') && !jurNestedPercentsSatisfied(card)) {
            card.querySelector('.nested-founders-block.jur-founders-inner .founders-sum')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            return false;
        }

        const fields = card.querySelectorAll('[data-path]');
        let isValid = true;
        
        fields.forEach(field => {
            if (typeof window.validateField === 'function') {
                if (!window.validateField(field)) isValid = false;
            } else {
                if (field.hasAttribute('required') && !field.value.trim()) {
                    field.classList.add('input-error');
                    isValid = false;
                }
            }
        });
        return isValid;
    }

    function updateStateOrgUI(card) {
        const stateRadioYes = card.querySelector('input[type="radio"][data-path$=".isState"][value="true"]');
        const isStateOrg = !!stateRadioYes?.checked;

        const innerBlock = card.querySelector('.nested-founders-block.jur-founders-inner');
        if (innerBlock) {
            if (isStateOrg) {
                innerBlock.style.display = 'none';
                innerBlock.setAttribute('data-ignore-container', '1');
            } else {
                innerBlock.style.display = '';
                innerBlock.removeAttribute('data-ignore-container');
                updateSum(innerBlock);
            }
        }

        const iconEl = card.querySelector('.founder-preview .founder-icon');
        if (iconEl) iconEl.textContent = isStateOrg ? STATE_ORG_ICON : JUR_ICON;

        syncJurFounderCardSaveEnabled(card);
    }

    function toggleState(card, state) {
        const preview = card.querySelector('.founder-preview');
        const form = card.querySelector('.founder-form-content');
        const nameInput = card.querySelector('[data-path$=".name"]');
        const nameDisplay = card.querySelector('.founder-name-text');

        if (state === 'saved') {
            nameDisplay.textContent = nameInput?.value || "Без имени";
            updateStateOrgUI(card);
            preview.style.display = 'flex';
            form.style.display = 'none';
            card.setAttribute('data-state', 'saved');
        } else {
            preview.style.display = 'none';
            form.style.display = 'block';
            card.setAttribute('data-state', 'editing');
            updateStateOrgUI(card);
        }
    }

    function updateSum(block) {
        if (!block) return;
        const { list, sumEl } = getBlockElements(block);
        if (!list || !sumEl) return;

        const inputs = list.querySelectorAll(':scope > .nested-founder-item > .nested-founder-fields > .founder-capital-percent');
        let total = 0;
        inputs.forEach(input => total += parseFloat(input.value) || 0);

        total = Math.round(total * 100) / 100;

        const sumTextEl = sumEl.querySelector('.founders-sum-text');
        const sumText = total === 100 ? '100% ---- ВСЕ УЧРЕДИТЕЛИ ВВЕДЕНЫ' :
            total > 100 ? `${total}% ---- ПРЕВЫШЕНИЕ 100%!` : `${total}% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ`;

        sumEl.setAttribute('data-sum', total);
        if (sumTextEl) {
            sumTextEl.textContent = sumText;
        } else {
            sumEl.textContent = sumText;
        }

        sumEl.classList.toggle('founders-sum--complete', total === 100);
        sumEl.classList.toggle('founders-sum--incomplete', total !== 100);

        const jurRootCard = block.closest('.card-jur-founder');
        if (jurRootCard) syncJurFounderCardSaveEnabled(jurRootCard);
    }

    /** Все видимые блоки вложенных учредителей в карточке юрлица — сумма долей 100% (блоки госоргана не учитываются). */
    function jurNestedPercentsSatisfied(card) {
        if (!card || !card.classList.contains('card-jur-founder')) return true;
        const blocks = card.querySelectorAll('.nested-founders-block');
        for (let i = 0; i < blocks.length; i += 1) {
            const b = blocks[i];
            if (b.hasAttribute('data-ignore-container')) continue;
            const sumEl = b.querySelector('.founders-sum');
            if (!sumEl) continue;
            const raw = sumEl.getAttribute('data-sum');
            const total = raw === null || raw === '' ? NaN : parseFloat(raw, 10);
            if (!Number.isFinite(total) || total !== 100) return false;
        }
        return true;
    }

    function syncJurFounderCardSaveEnabled(card) {
        if (!card || !card.classList.contains('card-jur-founder')) return;
        const saveBtn = card.querySelector('.founder-form-content .form-footer-actions .btn-save-founder');
        if (!saveBtn) return;
        const ok = jurNestedPercentsSatisfied(card);
        saveBtn.disabled = !ok;
        saveBtn.title = ok
            ? ''
            : 'Сумма долей вложенных учредителей должна быть ровно 100% по каждому юридическому лицу, для которого они заданы.';
    }

    function reindexRecursive(element, newPrefix) {
        const immediateInputs = element.querySelectorAll('[data-path]');
        immediateInputs.forEach(el => {
            const path = el.getAttribute('data-path');
            const parts = path.split('.');
            const fieldName = parts[parts.length - 1];
            
            el.setAttribute('data-path', `${newPrefix}.${fieldName}`);
        });

        const block = element.querySelector(':scope > .nested-founder-fields > .nested-founders-block');
        const mainBlock = element.classList.contains('card-jur-founder') ? element.querySelector('.nested-founders-block') : block;
        
        const targetBlock = mainBlock;
        if (targetBlock) {
            targetBlock.setAttribute('data-parent-path', newPrefix);
            const { list, sumEl } = getBlockElements(targetBlock);
            if (list) list.setAttribute('data-owner-path', newPrefix);
            if (sumEl) sumEl.setAttribute('data-owner-path', newPrefix);

            if (list) {
                const items = list.querySelectorAll(':scope > .nested-founder-item');
                items.forEach((item, idx) => {
                    reindexRecursive(item, `${newPrefix}.founders.${idx}`);
                });
            }
        }
    }

    function removeNestedFounder(item) {
        const block = item.closest('.nested-founders-block');
        item.remove();
        reindexAll();
        
        if (block) {
            updateSum(block);
        }
    }

    function reindexAll() {
        const container = getContainer();
        const cards = container.querySelectorAll('.card-jur-founder');
        cards.forEach((card, idx) => {
            const newPrefix = `${BASE_PATH}.${idx}`;
            card.setAttribute('data-jur-person-index', idx);
            card.setAttribute('data-parent-path', newPrefix);

            // Обновляем радио-кнопки
            card.querySelectorAll('input[type="radio"]').forEach(r => r.name = `jurState${idx}`);

            reindexRecursive(card, newPrefix);

            const nameInput = card.querySelector('[data-path$=".name"]');
            const nameDisplay = card.querySelector('.founder-name-text');
            if (nameDisplay && nameInput) {
                nameDisplay.textContent = nameInput.value || "Без имени";
            }
            updateStateOrgUI(card);
            card.querySelectorAll('.nested-founders-block').forEach((b) => {
                if (!b.hasAttribute('data-ignore-container')) updateSum(b);
            });
        });
    }

    function checkContainersAndFiller() {
        if (!FILLER_LIST) return;
        const physCards = getPhysContainer()?.querySelectorAll('.card-physical-founder').length || 0;
        const jurCards = getContainer()?.querySelectorAll('.card-jur-founder').length || 0;

        if (physCards === 0 && jurCards === 0) {
            FILLER_LIST.style.display = 'block';
        } else {
            FILLER_LIST.style.display = 'none';
        }
    }

    function init() {
        const container = getContainer();
        const addBtns = document.querySelectorAll(ADD_BUTTON_SELECTOR);
        if (!container) return;
        if (container.hasAttribute('data-jur-founders-inited')) return;
        container.setAttribute('data-jur-founders-inited', '1');

        addBtns.forEach(btn => btn.addEventListener('click', () => {
            const idx = container.querySelectorAll('.card-jur-founder').length;
            container.insertAdjacentHTML('beforeend', buildFormCard(idx));
            if (FILLER_LIST) FILLER_LIST.style.display = 'none';
            const newCard = container.querySelector(`.card-jur-founder[data-jur-person-index="${idx}"]`);
            if (newCard) updateStateOrgUI(newCard);
            clearFieldError(document.getElementById('err_block'));
        }));

        document.addEventListener('click', (e) => {
            const target = e.target;
            const card = target.closest('.card-jur-founder');

            if (card) {
                if (target.classList.contains('btn-save-founder')) {
                    if (validateFounderForm(card)) {
                        toggleState(card, 'saved');
                        card.dataset.isNew = '0';
                        snapshotSaved(card);
                        if (FILLER_LIST) FILLER_LIST.style.display = 'none';
                        clearFieldError(document.getElementById('err_block'));
                        let elem = document.querySelector(".jur-founder-title");
                        if (elem) {
                            elem.innerHTML = "Редактирование учредителя СМИ – юридическое лицо";
                        }
                        let bnt = document.querySelector(".btn-save-founder");
                        if(bnt){
                            bnt.innerText = "Редактировать";
                        }
                    } else {
                        card.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                if (target.classList.contains('btn-cancel-founder')) {
                    if (card.dataset.isNew === '1') {
                        card.remove();
                        reindexAll();
                        checkContainersAndFiller();
                    } else {
                        restoreSaved(card);
                    }
                    return;
                }

                if (target.closest('.button_edit_founder') && !target.closest('.nested-founder-item')) {
                    toggleState(card, 'editing');
                    return;
                }

                if (target.closest('.button_remove_founder') && !target.closest('.nested-founder-item')) {
                    card.remove();
                    reindexAll();
                    checkContainersAndFiller();
                    return;
                }
            }

            if (target.closest('[data-nested-founder-remove]')) {
                const item = target.closest('.nested-founder-item');
                removeNestedFounder(item);
                return;
            }

            if (target.closest('[data-nested-founder-edit]')) {
                const item = target.closest('.nested-founder-item');
                if (!item) return;
                const isJur = item.classList.contains('nested-founder-jur');
                const parentPath = item.getAttribute('data-founder-path')?.replace(/\.founders\.\d+$/, '');
                if (!parentPath) return;
                openNestedFounderDialog({ type: isJur ? 'jur' : 'fiz', parentPath, item });
                return;
            }

            if (target.closest('.button_add_nested') && !target.closest('#office-owners-container')) {
                const btn = target.closest('.button_add_nested');
                const block = btn.closest('.nested-founders-block');
                if (!block || !container.contains(block)) return;
                const type = btn.hasAttribute('data-add-nested-jur') ? 'jur' : 'fiz';
                const parentPath = block.getAttribute('data-parent-path');
                openNestedFounderDialog({ type, parentPath, item: null });
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('founder-capital-percent')) {
                updateSum(e.target.closest('.nested-founders-block'));
            }

            if (e.target.matches && e.target.matches('.card-jur-founder input[type="radio"][data-path$=".isState"]')) {
                const card = e.target.closest('.card-jur-founder');
                if (card) updateStateOrgUI(card);
            }
        });

        checkContainersAndFiller();
    }

    init();
};
jur_person_founder();

/**
 * Собственники имущества редакции (office.owners): вложенная структура как у учредителей.
 * data-path office.owners.0.*, office.owners.0.owners.0.* для buildJsonFromForm().
 */
const office_owners = function () {
    const CONTAINER_ID = 'office-owners-container';
    const BASE_PATH = 'office'; // База для корневого блока
    const SEGMENT = 'owners';   // Ключ массива
    const STATE_ORG_ICON = '🏛️';
    const JUR_ICON = '💼';

    const savedStates = new WeakMap();

    function snapshotSaved(card) {
        const basePrefix = `${card.getAttribute('data-founder-path')}.`;
        const state = { values: {}, radios: {}, checks: {}, nested: [] };

        card.querySelectorAll('[data-path]').forEach((el) => {
            const path = el.getAttribute('data-path');
            if (!path || !path.startsWith(basePrefix)) return;
            const relKey = path.slice(basePrefix.length);

            if (el.type === 'radio') {
                if (el.checked) state.radios[relKey] = el.value;
                return;
            }

            if (el.type === 'checkbox') {
                state.checks[relKey] = !!el.checked;
                return;
            }

            state.values[relKey] = el.value;
        });

        card.querySelectorAll('.nested-founder-item').forEach((item) => {
            const founderPathAbs = item.getAttribute('data-founder-path');
            if (!founderPathAbs || !founderPathAbs.startsWith(card.getAttribute('data-founder-path'))) return;
            
            const m = founderPathAbs.match(/^(.*)\.owners\.(\d+)$/);
            if (!m) return;

            const parentPathAbs = m[1];
            const index = parseInt(m[2], 10);
            const type = item.classList.contains('nested-founder-jur') ? 'jur' : 'fiz';
            const depth = (founderPathAbs.match(/\.owners\.\d+/g) || []).length;

            state.nested.push({ parentPathAbs, index, type, depth });
        });

        savedStates.set(card, state);
    }

    function restoreSaved(card) {
        const state = savedStates.get(card);
        if (!state) {
            toggleStateOfficeOwner(card, 'saved');
            clearValidationUI(card);
            return;
        }

        card.dataset.isNew = '0';

        const basePrefix = `${card.getAttribute('data-founder-path')}.`;

        card.querySelectorAll('.nested-founders-list').forEach((listEl) => {
            listEl.innerHTML = '';
        });

        const orderedNested = [...state.nested].sort((a, b) => a.depth - b.depth);
        orderedNested.forEach((rec) => {
            const listEl = card.querySelector(`.nested-founders-list[data-owner-path="${rec.parentPathAbs}"]`);
            if (!listEl) return;
            listEl.insertAdjacentHTML('beforeend', buildNestedItem(rec.parentPathAbs, rec.index, rec.type));
        });

        card.querySelectorAll('[data-path]').forEach((el) => {
            const path = el.getAttribute('data-path');
            if (!path || !path.startsWith(basePrefix)) return;
            const relKey = path.slice(basePrefix.length);

            if (el.type === 'radio') {
                if (Object.prototype.hasOwnProperty.call(state.radios, relKey)) {
                    el.checked = el.value === state.radios[relKey];
                }
                return;
            }

            if (el.type === 'checkbox') {
                if (Object.prototype.hasOwnProperty.call(state.checks, relKey)) {
                    el.checked = !!state.checks[relKey];
                }
                return;
            }

            if (Object.prototype.hasOwnProperty.call(state.values, relKey)) {
                el.value = state.values[relKey] ?? '';
            }
        });

        card.querySelectorAll('.nested-founder-item').forEach((node) => {
            const v = readOfficeOwnerValues(node);
            if (v) applyOfficeOwnerData(node, v);
        });

        card.querySelectorAll('.nested-founder-item.nested-founder-jur').forEach((jurItem) => {
            updateOwnerStateOrgUI(jurItem);
        });

        toggleStateOfficeOwner(card, 'saved');

        card.querySelectorAll('.nested-founders-block').forEach((block) => {
            updateSum(block);
        });

        clearValidationUI(card);
    }

    const COUNTRY_OPTIONS = `
        <option value="" selected disabled hidden></option>
        <option>Республика Беларусь</option>
        <option>Российская Федерация</option>
        <option>Латвия</option>
        <option>Литва</option>
        <option>Эстония</option>
        <option>Польша</option>
    `;

    const getContainer = () => document.getElementById(CONTAINER_ID);

    function getBlockElements(block) {
        const path = block.getAttribute('data-parent-path');
        return {
            list: block.querySelector(`.nested-founders-list[data-owner-path="${path}"]`),
            sumEl: block.querySelector(`.founders-sum[data-owner-path="${path}"]`)
        };
    }

    function ensureOfficeOwnerDialogStyle() {
        if (document.getElementById('nested-founder-dialog-style')) return;
        const style = document.createElement('style');
        style.id = 'nested-founder-dialog-style';
        style.textContent = `
            .nested-founder-dialog-overlay { position: fixed; inset: 0; background: rgba(20, 22, 26, 0.45);
                display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
            .nested-founder-dialog { width: min(920px, 100%); max-height: calc(100vh - 40px); overflow: auto;
                background: #fff; border-radius: 12px; padding: 18px 18px 14px; box-shadow: 0 18px 45px rgba(0,0,0,0.18); }
            .nested-founder-dialog-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; }
            .nested-founder-dialog-close { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #d0d7de;
                background: #fff; color: #4b5563; font-size: 18px; line-height: 1; padding: 0; }
        `;
        document.head.appendChild(style);
    }

    function upsertHiddenOfficeField(item, path, value) {
        const fieldsRoot = item.querySelector(':scope > .nested-founder-fields') || item;
        let input = fieldsRoot.querySelector(`input[type="hidden"][data-path="${path}"]`);
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.setAttribute('data-path', path);
            fieldsRoot.appendChild(input);
        }
        input.value = value ?? '';
    }

    function readOfficeOwnerValues(item) {
        const path = item.getAttribute('data-founder-path');
        if (!path) return null;
        const read = (key) => item.querySelector(`[data-path="${path}.${key}"]`)?.value ?? '';
        return {
            name: read('name'),
            country: read('country'),
            capitalPercent: read('capitalPercent'),
            isState: read('isState') === 'true'
        };
    }

    function applyOfficeOwnerData(item, values) {
        const path = item.getAttribute('data-founder-path');
        if (!path) return;

        upsertHiddenOfficeField(item, `${path}.name`, values.name ?? '');
        upsertHiddenOfficeField(item, `${path}.country`, values.country ?? '');
        upsertHiddenOfficeField(item, `${path}.capitalPercent`, values.capitalPercent ?? '');
        if (item.classList.contains('nested-founder-jur')) {
            upsertHiddenOfficeField(item, `${path}.isState`, values.isState ? 'true' : 'false');
        }

        const nameText = item.querySelector('.founder-name-text') || item.querySelector('.nested-founder-name');
        // Для корневых карточек процентовка — `owner-percent-text`,
        // для вложенных строк — `nested-founder-percent`
        const percentText = item.querySelector('.owner-percent-text') || item.querySelector('.nested-founder-percent');
        const iconEl = item.querySelector('.nested-founder-preview .nested-founder-icon')
            || item.querySelector('.office-owner-preview .founder-icon');

        if (nameText) nameText.textContent = values.name?.trim() || 'Без имени';
        if (percentText) {
            percentText.textContent = values.capitalPercent?.toString().trim() !== ''
                ? `${values.capitalPercent}%` : '';
        }

        if (item.classList.contains('nested-founder-jur')) {
            const isState = !!values.isState;
            if (iconEl) iconEl.textContent = isState ? STATE_ORG_ICON : JUR_ICON;
            const innerBlock = item.querySelector(':scope > .nested-founder-fields > .nested-founders-block');
            if (innerBlock) {
                if (isState) {
                    innerBlock.style.display = 'none';
                    innerBlock.setAttribute('data-ignore-container', '1');
                } else {
                    innerBlock.style.display = '';
                    innerBlock.removeAttribute('data-ignore-container');
                }
            }
        }
    }

    function openOfficeOwnerDialog({ type, parentPath, item }) {
        ensureOfficeOwnerDialogStyle();
        const isJur = type === 'jur';
        const values = item ? readOfficeOwnerValues(item) : { name: '', country: '', capitalPercent: '', isState: false };

        const overlay = document.createElement('div');
        overlay.className = 'nested-founder-dialog-overlay';
        overlay.innerHTML = `
            <div class="nested-founder-dialog" role="dialog" aria-modal="true">
                <div class="nested-founder-dialog-header">
                    <h4 style="margin:0;">${item ? 'Редактирование' : 'Добавление'} собственника имущества — ${isJur ? 'юридического лица' : 'физического лица'}</h4>
                    <button type="button" class="nested-founder-dialog-close" aria-label="Закрыть">×</button>
                </div>
                ${isJur ? `
                <p class="subtitle">Является ли государственным органом (организацией)</p>
                <div class="inline-options" style="margin-top:0;">
                    <label><input type="radio" name="office_owner_jur_state_dialog" value="true" ${values.isState ? 'checked' : ''}> да</label>
                    <label><input type="radio" name="office_owner_jur_state_dialog" value="false" ${values.isState ? '' : 'checked'}> нет</label>
                </div>` : ''}
                <div class="full-width">
                    <label>${isJur ? 'Полное наименование юридического лица' : 'Фамилия, имя, отчество'}</label>
                    <input type="text" class="office-owner-dialog-name" required>
                </div>
                <div class="row">
                    <div class="field">
                        <label>${isJur ? 'Резидент какой страны' : 'Гражданство'}</label>
                        <select class="office-owner-dialog-country" required>${COUNTRY_OPTIONS}</select>
                    </div>
                    <div class="field field--short">
                        <label>Доля, %</label>
                        <input type="number" step="0.01" class="office-owner-dialog-percent" value="${values.capitalPercent || ''}" required>
                    </div>
                </div>
                <div class="form-footer-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="btn-save-founder office-owner-dialog-save">Сохранить</button>
                    <button type="button" class="btn-cancel-founder office-owner-dialog-cancel">Отменить</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        const nameField = overlay.querySelector('.office-owner-dialog-name');
        if (nameField) nameField.value = values.name || '';
        const countryEl = overlay.querySelector('.office-owner-dialog-country');
        if (countryEl) countryEl.value = values.country || '';

        const close = () => {
            overlay.remove();
            // Если закрыли без сохранения, снова скрыть пустой корневой блок (иначе остаётся «0% — ДОБАВЬТЕ УЧРЕДИТЕЛЯ» после getRootBlock).
            updateRootVisibility();
        };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        overlay.querySelector('.nested-founder-dialog-close')?.addEventListener('click', close);
        overlay.querySelector('.office-owner-dialog-cancel')?.addEventListener('click', close);

        overlay.querySelector('.office-owner-dialog-save')?.addEventListener('click', () => {
            const nameInput = overlay.querySelector('.office-owner-dialog-name');
            const countryInput = overlay.querySelector('.office-owner-dialog-country');
            const percentInput = overlay.querySelector('.office-owner-dialog-percent');
            const next = {
                name: nameInput?.value?.trim() || '',
                country: countryInput?.value || '',
                capitalPercent: percentInput?.value || '',
                isState: !!overlay.querySelector('input[name="office_owner_jur_state_dialog"][value="true"]')?.checked
            };

            let hasError = false;
            [nameInput, countryInput, percentInput].forEach((field) => {
                if (!field) return;
                const invalid = !field.value || !String(field.value).trim();
                field.classList.toggle('input-error', invalid);
                if (invalid) hasError = true;
            });
            if (hasError) return;

            const officeContainer = getContainer();
            if (!officeContainer) return;

            if (item) {
                applyOfficeOwnerData(item, next);
                const parentBlock = item.closest('.nested-founders-block');
                if (parentBlock) updateSum(parentBlock);
            } else {
                const block = officeContainer.querySelector(`.nested-founders-block[data-parent-path="${parentPath}"]`);
                const { list } = getBlockElements(block);
                if (!block || !list) return;
                const index = list.querySelectorAll(':scope > .nested-founder-item').length;
                const html = parentPath === BASE_PATH
                    ? buildRootOwnerItem(index, type)
                    : buildNestedItem(parentPath, index, type);
                list.insertAdjacentHTML('beforeend', html);
                const addedItem = list.querySelector(':scope > .nested-founder-item:last-child');
                if (addedItem) applyOfficeOwnerData(addedItem, next);
                updateSum(block);
                if (parentPath === BASE_PATH) updateRootVisibility();
            }

            close();
        });
    }

    // Вложенные собственники — компактная строка + скрытые поля; ввод через модальное окно
    function buildNestedItem(parentPath, index, type) {
        const path = `${parentPath}.${SEGMENT}.${index}`;
        const isJur = type === 'jur';

        return `
            <div class="nested-founder-item ${isJur ? 'nested-founder-jur' : 'nested-founder-fiz'}" data-founder-path="${path}" data-state="saved" data-is-new="0">
                <div class="nested-founder-preview">
                    <div>
                        <div class="nested-founder-preview-main">
                            <span class="nested-founder-percent"></span>
                            <span class="nested-founder-icon ${isJur ? 'nested-founder-icon--jur' : 'nested-founder-icon--fiz'}" title="${isJur ? 'Юр. лицо' : 'Физ. лицо'}">
                                ${isJur ? JUR_ICON : '👤'}
                            </span>
                            <span class="nested-founder-name">Новый собственник</span>
                        </div>
                    </div>
                    <div class="nested-founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать" aria-label="Редактировать" data-office-owner-edit>✏️</button>
                        <button type="button" class="button_remove_founder" title="Удалить" aria-label="Удалить" data-office-owner-item-remove>✕</button>
                    </div>
                </div>
                <div class="nested-founder-fields">
                    <input type="hidden" data-path="${path}.typeFace" value="${isJur ? 'jurFace' : 'fizFace'}">
                    <input type="hidden" data-path="${path}.name" value="">
                    <input type="hidden" data-path="${path}.country" value="">
                    <input type="hidden" data-path="${path}.capitalPercent" class="founder-capital-percent" value="">
                    ${isJur ? `<input type="hidden" data-path="${path}.isState" value="false">` : ''}
                    ${isJur ? `
                    <div class="nested-founders-block" data-parent-path="${path}">
                        <p class="nested-founders-title">УЧРЕДИТЕЛИ УКАЗАННОГО ЮРИДИЧЕСКОГО ЛИЦА:</p>
                        <div class="nested-founders-list" data-owner-path="${path}"></div>
                        <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${path}">
                            <span class="founders-sum-text">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</span>
                            <div class="nested-founders-actions">
                                <button type="button" class="button_add_nested" data-add-office-nested-jur>+ Юр. лицо</button>
                                <button type="button" class="button_add_nested" data-add-office-nested-fiz>+ Физ. лицо</button>
                            </div>
                        </div>
                    </div>` : ''}
                </div>
            </div>`;
    }

    // Корневой уровень (office.owners) — превью + скрытые поля; ввод через модальное окно
    function buildRootOwnerItem(index, type) {
        const path = `${BASE_PATH}.${SEGMENT}.${index}`;
        const isJur = type === 'jur';

        return `
            <div class="nested-founder-item office-owner-root ${isJur ? 'nested-founder-jur' : 'nested-founder-fiz'}" data-founder-path="${path}" data-state="saved" data-is-new="0">
                <div class="office-owner-preview founder-preview">
                    <div class="founder-preview-info">
                        <span class="owner-percent-text"></span>
                        <span class="founder-icon">${isJur ? JUR_ICON : '👤'}</span>
                        <span class="founder-name-text">Новый собственник</span>
                    </div>
                    <div class="founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать" aria-label="Редактировать" data-office-owner-edit>✏️</button>
                        <button type="button" class="button_remove_founder" title="Удалить" aria-label="Удалить">✕</button>
                    </div>
                </div>
                <div class="nested-founder-fields">
                    <input type="hidden" data-path="${path}.typeFace" value="${isJur ? 'jurFace' : 'fizFace'}">
                    <input type="hidden" data-path="${path}.name" value="">
                    <input type="hidden" data-path="${path}.country" value="">
                    <input type="hidden" data-path="${path}.capitalPercent" class="founder-capital-percent" value="">
                    ${isJur ? `<input type="hidden" data-path="${path}.isState" value="false">` : ''}
                    ${isJur ? `
                    <div class="nested-founders-block" data-parent-path="${path}">
                        <p class="nested-founders-title">УЧРЕДИТЕЛИ УКАЗАННОГО ЮРИДИЧЕСКОГО ЛИЦА:</p>
                        <div class="nested-founders-list" data-owner-path="${path}"></div>
                        <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${path}">
                            <span class="founders-sum-text">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</span>
                            <div class="nested-founders-actions">
                                <button type="button" class="button_add_nested" data-add-office-nested-jur>+ Юр. лицо</button>
                                <button type="button" class="button_add_nested" data-add-office-nested-fiz>+ Физ. лицо</button>
                            </div>
                        </div>
                    </div>` : ''}
                </div>
            </div>`;
    }

    function getRootBlock() {
        const container = getContainer();
        if (!container) return null;
        let block = container.querySelector(`.nested-founders-block[data-parent-path="${BASE_PATH}"]`);
        if (!block) {
            container.insertAdjacentHTML('afterbegin', `
                <div class="nested-founders-block jur-founders-inner" data-parent-path="${BASE_PATH}">
                    <p class="nested-founders-title">УЧРЕДИТЕЛИ:</p>
                    <div class="nested-founders-list" data-owner-path="${BASE_PATH}"></div>
                    <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${BASE_PATH}">
                        <span class="founders-sum-text">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</span>
                        <div class="nested-founders-actions" style="display:none;"></div>
                    </div>
                </div>`);
            block = container.querySelector(`.nested-founders-block[data-parent-path="${BASE_PATH}"]`);
        }
        return block;
    }


    function updateSum(block) {
        if (!block) return;
        const { list, sumEl } = getBlockElements(block);
        if (!list || !sumEl) return;

        const items = list.querySelectorAll(':scope > .nested-founder-item');
        let total = 0;
        items.forEach(item => {
            const inp = item.querySelector(':scope > .nested-founder-fields > .founder-capital-percent')
                || item.querySelector('.founder-capital-percent');
            if (inp) total += parseFloat(inp.value) || 0;
        });
        total = Math.round(total * 100) / 100;

        const sumTextEl = sumEl.querySelector('.founders-sum-text');
        const sumText = total === 100 ? '100% ---- ВСЕ УЧРЕДИТЕЛИ ВВЕДЕНЫ' : 
                           total > 100 ? `${total}% ---- ПРЕВЫШЕНИЕ 100%!` : `${total}% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ`;

        sumEl.setAttribute('data-sum', total);
        if (sumTextEl) {
            sumTextEl.textContent = sumText;
        } else {
            sumEl.textContent = sumText;
        }
        
        sumEl.classList.toggle('founders-sum--complete', total === 100);
        sumEl.classList.toggle('founders-sum--incomplete', total !== 100);
    }

    function reindexRecursive(element, newPrefix) {
        element.setAttribute('data-founder-path', newPrefix);
        const paths = element.querySelectorAll('[data-path]');
        paths.forEach(el => {
            const currentPath = el.getAttribute('data-path');
            
            const parts = currentPath.split('.');
            const fieldName = parts[parts.length - 1];
            el.setAttribute('data-path', `${newPrefix}.${fieldName}`);
        });

        const newRadioName = 'officeState_' + newPrefix.replace(/\./g, '_');
        element.querySelectorAll('input[type="radio"]').forEach(r => {
            r.name = newRadioName;
        });

        const nestedBlock = element.querySelector(':scope > .nested-founder-fields > .nested-founder-fields-inner > .nested-founders-block')
            || element.querySelector(':scope > .nested-founder-fields > .nested-founders-block');

        if (nestedBlock) {
            nestedBlock.setAttribute('data-parent-path', newPrefix);
            const { list, sumEl } = getBlockElements(nestedBlock);
            
            if (list) {
                list.setAttribute('data-owner-path', newPrefix);
                if (sumEl) sumEl.setAttribute('data-owner-path', newPrefix);

                const children = list.querySelectorAll(':scope > .nested-founder-item');
                children.forEach((child, idx) => {
                    reindexRecursive(child, `${newPrefix}.${SEGMENT}.${idx}`);
                });
            }
        }

        updateOwnerStateOrgUI(element);
    }

    function updateOwnerStateOrgUI(item) {
        const stateHidden = item.querySelector('input[type="hidden"][data-path$=".isState"]');
        const isStateOrg = stateHidden?.value === 'true';

        const innerBlock = item.querySelector(':scope > .nested-founder-fields > .nested-founder-fields-inner > .nested-founders-block')
            || item.querySelector(':scope > .nested-founder-fields > .nested-founders-block');
        if (innerBlock) {
            if (isStateOrg) {
                innerBlock.style.display = 'none';
                innerBlock.setAttribute('data-ignore-container', '1');
            } else {
                innerBlock.style.display = '';
                innerBlock.removeAttribute('data-ignore-container');
            }
        }

        const iconEl = item.querySelector('.nested-founder-preview .nested-founder-icon');
        if (iconEl && item.classList.contains('nested-founder-jur')) {
            iconEl.textContent = isStateOrg ? STATE_ORG_ICON : JUR_ICON;
        }
        const previewIcon = item.querySelector('.office-owner-preview .founder-icon');
        if (previewIcon && item.classList.contains('nested-founder-jur')) {
            previewIcon.textContent = isStateOrg ? STATE_ORG_ICON : JUR_ICON;
        }
    }

    function toggleStateOfficeOwner(item, state) {
        const preview = item.querySelector('.office-owner-preview.founder-preview');
        const legacyForm = item.querySelector('.nested-founder-fields.office-owner-form');
        const nameInput = item.querySelector('[data-path$=".name"]');
        const percentInput = item.querySelector('[data-path$=".capitalPercent"]');
        const nameDisplay = item.querySelector('.office-owner-preview .founder-name-text');
        const percentDisplay = item.querySelector('.office-owner-preview .owner-percent-text');
        if (state === 'saved') {
            const name = nameInput?.value?.trim() || 'Без имени';
            const percentRaw = percentInput?.value;
            const percent = percentRaw && percentRaw.trim() !== '' ? `${percentRaw}%` : '';
            if (nameDisplay) nameDisplay.textContent = name;
            if (percentDisplay) percentDisplay.textContent = percent;
            updateOwnerStateOrgUI(item);
            if (preview) preview.style.display = 'flex';
            if (legacyForm) legacyForm.style.display = 'none';
            item.setAttribute('data-state', 'saved');
        } else {
            if (preview) preview.style.display = 'none';
            if (legacyForm) legacyForm.style.display = '';
            item.setAttribute('data-state', 'editing');
            updateOwnerStateOrgUI(item);
        }
    }

    function reindexAll() {
        const root = getRootBlock();
        if (!root) return;
        const { list } = getBlockElements(root);
        if (!list) return;

        const items = list.querySelectorAll(':scope > .nested-founder-item');
        items.forEach((item, idx) => {
            const newPrefix = `${BASE_PATH}.${SEGMENT}.${idx}`;
            reindexRecursive(item, newPrefix);
        });
    }

    function updateRootVisibility() {
        const root = getRootBlock();
        if (!root) return;
        const { list } = getBlockElements(root);
        if (!list) return;

        const hasItems = list.querySelector(':scope > .nested-founder-item') !== null;
        if (hasItems) {
            root.style.display = '';
            root.removeAttribute('data-ignore-container');
        } else {
            root.style.display = 'none';
            root.setAttribute('data-ignore-container', '1');
        }
    }

    function removeOwner(item) {
        const block = item.closest('.nested-founders-block');
        item.remove();
        reindexAll();
        if (block) updateSum(block);
        updateRootVisibility();
    }

    function init() {
        const container = getContainer();
        if (!container || container.hasAttribute('data-office-owners-inited')) return;
        container.setAttribute('data-office-owners-inited', '1');

        document.addEventListener('click', (e) => {
            const target = e.target;

            const addRootBtn = target.closest('[data-add-office-owner]');
            if (addRootBtn) {
                const type = addRootBtn.getAttribute('data-add-office-owner');
                getRootBlock();
                openOfficeOwnerDialog({ type, parentPath: BASE_PATH, item: null });
            }

            if (target.closest('[data-office-owner-edit]')) {
                const officeItem = target.closest('.nested-founder-item');
                if (!officeItem || !container.contains(officeItem)) return;
                const isJur = officeItem.classList.contains('nested-founder-jur');
                openOfficeOwnerDialog({ type: isJur ? 'jur' : 'fiz', parentPath: null, item: officeItem });
            }

            if (target.closest('[data-office-owner-item-remove]')) {
                const officeItem = target.closest('.nested-founder-item');
                if (officeItem && container.contains(officeItem)) {
                    removeOwner(officeItem);
                }
                return;
            }

            const officeItemLegacy = target.closest('.nested-founder-item');
            if (officeItemLegacy && container.contains(officeItemLegacy)) {
                if (target.classList.contains('btn-save-founder')) {
                    if (typeof window.validateField === 'function') {
                        let ok = true;
                        officeItemLegacy.querySelectorAll('.nested-founder-fields-inner [data-path]').forEach((field) => {
                            if (!window.validateField(field)) ok = false;
                        });
                        if (ok) {
                            toggleStateOfficeOwner(officeItemLegacy, 'saved');
                            officeItemLegacy.dataset.isNew = '0';
                            snapshotSaved(officeItemLegacy);
                            const block = officeItemLegacy.closest('.nested-founders-block');
                            if (block) updateSum(block);
                        }
                    }
                }
                if (target.classList.contains('btn-cancel-founder')) {
                    if (officeItemLegacy.dataset.isNew === '1') {
                        removeOwner(officeItemLegacy);
                    } else {
                        restoreSaved(officeItemLegacy);
                    }
                }
                if (target.closest('.button_remove_founder')) {
                    removeOwner(officeItemLegacy);
                }
            }

            const addNestedBtn = target.closest('.button_add_nested');
            if (addNestedBtn && addNestedBtn.closest('#' + CONTAINER_ID)) {
                const block = addNestedBtn.closest('.nested-founders-block');
                const type = addNestedBtn.hasAttribute('data-add-office-nested-jur') ? 'jur' : 'fiz';
                const parentPath = block.getAttribute('data-parent-path');
                openOfficeOwnerDialog({ type, parentPath, item: null });
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('founder-capital-percent')) {
                const block = e.target.closest('.nested-founders-block');
                if (block && container.contains(block)) {
                    updateSum(block);
                }
            }
        });
    }

    init();
};
office_owners();


const domain_owner_container = function () {
    const container = document.getElementById('domain-owner-container');
    if (!container) return;

    function renderOwnerCard(type) {
        const isFiz = type === 'fiz';
        container.innerHTML = `
      <div class="card_wrapper" data-owner-type="${type}">
      <div class="domain-owner-title">Добавление владельца СМИ – ${isFiz ? 'физического лица:' : 'юридического лица:'}</div>
        <button type="button" class="button_remove" title="Удалить" aria-label="Удалить" data-domain-owner-remove>×</button>

        <div class="row">
          <div>
            <label>${isFiz ? 'Фамилия, собственное имя, отчество (если таковое имеется) гражданина' : 'Полное наименование юридического лица'}</label>
            <input type="text" data-path="domainOwner.name" required>
          </div>
          <div>
            <label>Резидент какой страны</label>
            <input type="text" data-path="domainOwner.country" required>
          </div>
        </div>

        ${isFiz ? '' : `
          <div class="full-width">
            <label>Доля иностранного участия в уставном фонде, %</label>
            <input type="number" data-path="domainOwner.capitalPercent" inputmode="numeric" data-validate="percent" data-max-percent="20" required>
           
          </div>
        `}

        <div class="full-width">
          <label>Адрес (почтовый индекс, область, район, город, населенный пункт, улица, номер дома, корпус, квартира/офис)</label>
          <input type="text" data-path="domainOwner.address" required>
        </div>

        <label>Контактный телефон</label>
        <div class="row">
          <div>
            <label>Код:</label>
            <input type="tel" inputmode="numeric" data-path="domainOwner.phoneCode" required>
          </div>
          <div>
            <label>Телефон:</label>
            <input type="tel" data-path="domainOwner.phone" required>
          </div>
          <div>
            <label>Факс</label>
            <input type="text" data-path="domainOwner.fax">
          </div>
          <div>
            <label>Адрес электронной почты</label>
            <input type="email" data-path="domainOwner.email" data-validate="email" required>
          </div>
        </div>

        <div class="full-width">
          <label>Доменное имя сетевого издания</label>
          <input type="text" data-path="domainOwner.domainName">
        </div>

        <input type="hidden" data-path="domainOwner.typeFace" value="${isFiz ? 'fizFace' : 'jurFace'}">
      </div>
    `;
    }

    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('[data-domain-owner-add]');
        if (addBtn) {
            clearFieldError(document.getElementById('err_block'));
            const type = addBtn.getAttribute('data-domain-owner-add');
            renderOwnerCard(type);
            return;
        }

        const removeBtn = e.target.closest('[data-domain-owner-remove]');
        if (removeBtn) {
            container.innerHTML = '';
        }
    });
};
domain_owner_container();

/**
 * Источники финансирования (5.2): спонсоры — физ. или юр. лицо.
 * data-path sponsors.0.*, sponsors.1.* для buildJsonFromForm().
 */
const sponsors_financing = function () {
    const CONTAINER_ID = 'sponsors-container';
    const BASE_PATH = 'sponsors';

    const savedStates = new WeakMap();

    function snapshotSaved(card) {
        const idx = card.getAttribute('data-sponsor-index');
        const basePrefix = `${BASE_PATH}.${idx}.`;
        const state = { values: {}, radios: {}, checks: {} };

        card.querySelectorAll('[data-path]').forEach((el) => {
            const path = el.getAttribute('data-path');
            if (!path || !path.startsWith(basePrefix)) return;
            const relKey = path.slice(basePrefix.length);

            if (el.type === 'radio') {
                if (el.checked) state.radios[relKey] = el.value;
                return;
            }

            if (el.type === 'checkbox') {
                state.checks[relKey] = !!el.checked;
                return;
            }

            state.values[relKey] = el.value;
        });

        savedStates.set(card, state);
    }

    function restoreSaved(card) {
        const state = savedStates.get(card);
        if (!state) {
            toggleSponsorState(card, 'saved');
            clearValidationUI(card);
            return;
        }

        const idx = card.getAttribute('data-sponsor-index');
        const basePrefix = `${BASE_PATH}.${idx}.`;

        card.querySelectorAll('[data-path]').forEach((el) => {
            const path = el.getAttribute('data-path');
            if (!path || !path.startsWith(basePrefix)) return;
            const relKey = path.slice(basePrefix.length);

            if (el.type === 'radio') {
                if (Object.prototype.hasOwnProperty.call(state.radios, relKey)) {
                    el.checked = el.value === state.radios[relKey];
                }
                return;
            }

            if (el.type === 'checkbox') {
                if (Object.prototype.hasOwnProperty.call(state.checks, relKey)) {
                    el.checked = !!state.checks[relKey];
                }
                return;
            }

            if (Object.prototype.hasOwnProperty.call(state.values, relKey)) {
                el.value = state.values[relKey] ?? '';
            }
        });

        toggleSponsorState(card, 'saved');

        clearValidationUI(card);
    }

    const COUNTRY_OPTIONS = `
        <option value="" selected disabled hidden></option>
        <option>Республика Беларусь</option>
        <option>Российская Федерация</option>
        <option>Латвия</option>
        <option>Литва</option>
        <option>Эстония</option>
        <option>Польша</option>
    `;

    const getContainer = () => document.getElementById(CONTAINER_ID);

    function buildSponsorCard(index, type) {
        const p = `${BASE_PATH}.${index}`;
        const isFiz = type === 'fiz';

        return `
            <div class="card card-sponsor" data-sponsor-index="${index}" data-state="editing" data-is-new="1">
                <div class="founder-preview" style="display: none;">
                    <div class="founder-preview-info">
                        <span class="founder-icon">${isFiz ? '👤' : '💼'}</span>
                        <span class="founder-name-text">Новый спонсор</span>
                    </div>
                    <div class="founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать" aria-label="Редактировать">✏️</button>
                        <button type="button" class="button_remove_founder" title="Удалить" aria-label="Удалить">✕</button>
                    </div>
                </div>

                <div class="sponsor-form-content">
                    <h4 class="sponsor-title">ДОБАВЛЕНИЕ ИСТОЧНИКА ФИНАНСИРОВАНИЯ – ${isFiz ? 'ФИЗИЧЕСКОГО ЛИЦА' : 'ЮРИДИЧЕСКОГО ЛИЦА'}:</h4>
                    <input type="hidden" data-path="${p}.typeFace" value="${isFiz ? 'fizFace' : 'jurFace'}">

                    ${isFiz ? `
                    <div class="full-width">
                        <label>Фамилия, собственное имя, отчество (если таковое имеется) гражданина (граждан), лица без гражданства (лиц без гражданства)</label>
                        <input type="text" data-path="${p}.name" required>
                    </div>
                    <div class="row">
                        <div class="field">
                            <label>Гражданство</label>
                            <select data-path="${p}.country" required>${COUNTRY_OPTIONS}</select>
                        </div>
                        <div class="field field--short">
                            <label>Доля в уставном фонде, %</label>
                            <input type="number" step="0.01" inputmode="decimal" data-path="${p}.shareInCapital" 
                            inputmode="numeric" data-validate="percent" required>
                        </div>
                    </div>
                    <div class="full-width">
                        <label>Место постоянного проживания</label>
                        <input type="text" data-path="${p}.address" required>
                    </div>
                    ` : `
                    <div class="full-width">
                        <label>Полное наименование юридического лица</label>
                        <input type="text" data-path="${p}.name" required>
                    </div>
                    <div class="row">
                        <div class="field">
                            <label>Резидент какой страны</label>
                            <select data-path="${p}.country" required>${COUNTRY_OPTIONS}</select>
                        </div>
                        <div class="field field--short">
                            <label>Доля в уставном фонде, %</label>
                            <input type="number" step="0.01" inputmode="decimal" data-path="${p}.shareInCapital" 
                            inputmode="numeric" data-validate="percent" required>
                        </div>
                    </div>
                    `}

                    <p class="subtitle">ФОРМА УЧАСТИЯ В ФИНАНСИРОВАНИИ:</p>
                    <p class="form-hint">посредством участия в уставном фонде юридического лица, на которое возложены функции редакции средства массовой информации, другая форма</p>
                    <div class="full-width">
                        <textarea data-path="${p}.participationForm" rows="4" required></textarea>
                    </div>

                    <div class="form-footer-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                        <button type="button" class="btn-save-founder">Сохранить</button>
                        <button type="button" class="btn-cancel-founder">Отменить</button>
                    </div>
                </div>
            </div>`;
    }

    function validateSponsorForm(card) {
        const fields = card.querySelectorAll('[data-path]');
        let isValid = true;

        fields.forEach((field) => {
            if (typeof window.validateField === 'function') {
                if (!window.validateField(field)) isValid = false;
            } else {
                if (field.hasAttribute('required') && !field.value.trim()) {
                    field.classList.add('input-error');
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    function toggleSponsorState(card, state) {
        const preview = card.querySelector('.founder-preview');
        const form = card.querySelector('.sponsor-form-content');
        const nameInput = card.querySelector('[data-path$=".name"]');
        const nameDisplay = card.querySelector('.founder-name-text');

        if (!preview || !form) return;

        if (state === 'saved') {
            const titleEl = card.querySelector('.sponsor-title');
            if (titleEl) {
                const isFiz = card.querySelector('input[data-path$=".typeFace"][value="fizFace"]');
                titleEl.textContent = `РЕДАКТИРОВАНИЕ ИСТОЧНИКА ФИНАНСИРОВАНИЯ – ${isFiz ? 'ФИЗИЧЕСКОГО ЛИЦА' : 'ЮРИДИЧЕСКОГО ЛИЦА'}:`;
            }
            if (nameDisplay) nameDisplay.textContent = nameInput?.value || 'Без имени';
            preview.style.display = 'flex';
            form.style.display = 'none';
            card.setAttribute('data-state', 'saved');
        } else {
            preview.style.display = 'none';
            form.style.display = 'block';
            card.setAttribute('data-state', 'editing');
        }
    }

    function reindexSponsors() {
        const container = getContainer();
        if (!container) return;
        const cards = container.querySelectorAll('.card-sponsor');
        cards.forEach((card, newIndex) => {
            card.setAttribute('data-sponsor-index', newIndex);
            const newPrefix = `${BASE_PATH}.${newIndex}`;
            card.querySelectorAll('[data-path]').forEach(el => {
                const path = el.getAttribute('data-path');
                if (!path || path.indexOf(BASE_PATH + '.') !== 0) return;
                const rest = path.replace(new RegExp('^' + BASE_PATH.replace(/\./g, '\\.') + '\\.\\d+\\.'), '');
                el.setAttribute('data-path', newPrefix + '.' + rest);
            });
        });
    }

    function init() {
        const container = getContainer();
        if (!container) return;
        if (container.hasAttribute('data-sponsors-inited')) return;
        container.setAttribute('data-sponsors-inited', '1');

        document.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-add-sponsor]');
            if (addBtn) {
                const type = addBtn.getAttribute('data-add-sponsor');
                const idx = container.querySelectorAll('.card-sponsor').length;
                container.insertAdjacentHTML('beforeend', buildSponsorCard(idx, type));
                const newCard = container.querySelector(`.card-sponsor[data-sponsor-index="${idx}"]`);
                if (newCard) toggleSponsorState(newCard, 'editing');
                steps.addValStep5Sponsors();
                return;
            }

            const removeBtn = e.target.closest('[data-sponsor-remove]');
            if (removeBtn) {
                const card = removeBtn.closest('.card-sponsor');
                if (card) {
                    if (card.dataset.isNew === '1') {
                        card.remove();
                        reindexSponsors();
                    } else {
                        restoreSaved(card);
                    }
                }
                return;
            }

            const sponsorCard = e.target.closest('.card-sponsor');
            if (!sponsorCard) return;

            if (e.target.classList.contains('btn-save-founder')) {
                if (validateSponsorForm(sponsorCard)) {
                    toggleSponsorState(sponsorCard, 'saved');
                    sponsorCard.dataset.isNew = '0';
                    snapshotSaved(sponsorCard);
                } else {
                    sponsorCard.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            if (e.target.classList.contains('btn-cancel-founder')) {
                if (sponsorCard.dataset.isNew === '1') {
                    sponsorCard.remove();
                    reindexSponsors();
                } else {
                    restoreSaved(sponsorCard);
                }
                return;
            }

            if (e.target.closest('.button_edit_founder')) {
                toggleSponsorState(sponsorCard, 'editing');
                return;
            }

            if (e.target.closest('.button_remove_founder')) {
                sponsorCard.remove();
                reindexSponsors();
            }
        });
    }

    init();
};
sponsors_financing();

