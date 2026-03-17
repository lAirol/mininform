/**
 * Форма «Учредитель — физическое лицо»: добавление нескольких карточек,
 * data-path founders.0.*, founders.0.founders.0.* для сборки JSON через buildJsonFromForm().
 */
const physical_person_founder = function () {
    const CONTAINER_ID = 'physical-person-founders-container';
    const JSUR_CONTAINER_ID = 'jur-person-founders-container';
    const ADD_BUTTON_SELECTOR = '[data-add-physical-founder]';
    const BASE_PATH = 'founders_phys';
    const FILLER_LIST = document.getElementById("filler_2_2_list");

    const getContainer = () => document.getElementById(CONTAINER_ID);
    const getJsurContainer = () => document.getElementById(JSUR_CONTAINER_ID);

    function buildFormCard(index) {
        const p = `${BASE_PATH}.${index}`;
        return `
            <div class="form-add-founder card card-physical-founder" data-physical-person-index="${index}" data-state="editing">
                <div class="founder-preview" style="display: none;">
                    <div class="founder-preview-info">
                        <span class="founder-icon">👤</span>
                        <span class="founder-name-text">Новый учредитель</span>
                    </div>
                    <div class="founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать">✏️ Редактировать</button>
                        <button type="button" class="button_remove_founder" title="Удалить">🗑️ Удалить</button>
                    </div>
                </div>

                <div class="founder-form-content">
                    <button type="button" class="button_remove" title="Удалить" data-physical-person-remove>×</button>
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
                        <div class="field field--short">
                            <label>Доля, %</label>
                            <input type="number" step="0.01" data-path="${p}.sharePercent" data-validate="percent" placeholder="%" required>
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
                    </div>

                    <div class="form-footer-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                        <button type="button" class="btn-save-founder" style="background: #28a745; color: white; padding: 10px 20px; border: none; cursor: pointer;">Добавить</button>
                        <button type="button" class="btn-cancel-founder" style="background: #dc3545; color: white; padding: 10px 20px; border: none; cursor: pointer;">Отмена</button>
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
            FILLER_LIST.style.display = 'block';
        }
        cards.forEach((card, newIndex) => {
            card.setAttribute('data-physical-person-index', newIndex);
            const p = `${BASE_PATH}.${newIndex}`;
            
            card.querySelectorAll('[data-path]').forEach(el => {
                const path = el.getAttribute('data-path');
                const fieldName = path.split('.').pop();
                el.setAttribute('data-path', `${p}.${fieldName}`);
            });

            card.querySelectorAll('input[type="radio"]').forEach(radio => {
                const name = radio.getAttribute('name');
                if (name && name.startsWith('pp')) {
                    const suffix = name.split('_').pop();
                    radio.setAttribute('name', `pp${newIndex}_${suffix}`);
                }
            });
        });
    }

    function init() {
        const container = getContainer();
        const addButtons = document.querySelectorAll(ADD_BUTTON_SELECTOR);

        addButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = container.querySelectorAll('.card-physical-founder').length;
                if (FILLER_LIST) FILLER_LIST.style.display = 'none';
                container.insertAdjacentHTML('beforeend', buildFormCard(index));
            });
        });

        document.addEventListener('click', (e) => {
            const target = e.target;
            const card = target.closest('.card-physical-founder');

            if (!card) return;

            if (target.classList.contains('btn-save-founder')) {
                if (validateFounderForm(card)) {
                    toggleState(card, 'saved');
                    FILLER_LIST.style.display = 'none';
                } else {
                    card.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

            if (target.classList.contains('btn-cancel-founder') || target.closest('[data-physical-person-remove]')) {
                if (card.getAttribute('data-state') === 'editing' && !card.querySelector('[data-path$=".fullName"]').value) {
                    card.remove();
                    checkContainersAndReindex();
                } else {
                    toggleState(card, 'saved');
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
    }

    
    function checkContainersAndReindex() {
        reindexContainer();
        const physCards = getContainer()?.querySelectorAll('.card-physical-founder').length || 0;
        const jurCards = getJsurContainer()?.querySelectorAll('.card-jur-founder').length || 0;
    
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


    function buildNestedItem(parentPath, index, type) {
        const path = `${parentPath}.founders.${index}`;
        const isJur = type === 'jur';

        return `
            <div class="nested-founder-item ${isJur ? 'nested-founder-jur' : 'nested-founder-fiz'}" data-founder-path="${path}">
                <button type="button" class="button_remove button_remove--small" title="Удалить" data-nested-founder-remove>×</button>
                <span class="nested-founder-icon ${isJur ? 'nested-founder-icon--jur' : 'nested-founder-icon--fiz'}" title="${isJur ? 'Юр. лицо' : 'Физ. лицо'}">
                    ${isJur ? '💼' : '👤'}
                </span>
                <div class="nested-founder-fields">
                    <input type="hidden" data-path="${path}.typeFace" value="${isJur ? 'jurFace' : 'fizFace'}">
                    <div class="full-width">
                        <label>${isJur ? 'Полное наименование юридического лица' : 'Фамилия, имя, отчество'}</label>
                        <input type="text" data-path="${path}.name" placeholder="${isJur ? 'Наименование' : 'ФИО'}" required>
                    </div>
                    <div class="row">
                        <div class="field">
                            <label>${isJur ? 'Резидент какой страны' : 'Гражданство'}</label>
                            <select data-path="${path}.country" required>${COUNTRY_OPTIONS}</select>
                        </div>
                        <div class="field field--short">
                            <label>Доля, %</label>
                            <input type="number" step="0.01" inputmode="decimal" data-path="${path}.capitalPercent" class="founder-capital-percent" required>
                        </div>
                    </div>
                    ${isJur ? `
                    <div class="nested-founders-block" data-parent-path="${path}">
                        <p class="nested-founders-title">УЧРЕДИТЕЛИ УКАЗАННОГО ЮРИДИЧЕСКОГО ЛИЦА:</p>
                        <div class="nested-founders-list" data-owner-path="${path}"></div>
                        <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${path}">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</div>
                        <div class="nested-founders-actions">
                            <button type="button" class="button_add_nested" data-add-nested-jur>+ Юр. лицо</button>
                            <button type="button" class="button_add_nested" data-add-nested-fiz>+ Физ. лицо</button>
                        </div>
                    </div>` : ''}
                </div>
            </div>`;
    }

    function buildFormCard(index) {
        const p = `${BASE_PATH}.${index}`;
        return `
            <div class="form-add-founder card card-jur-founder" data-jur-person-index="${index}" data-parent-path="${p}" data-state="editing">
                <div class="founder-preview" style="display: none;">
                    <div class="founder-preview-info">
                        <span class="founder-icon">💼</span>
                        <span class="founder-name-text">Новый учредитель</span>
                    </div>
                    <div class="founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать">✏️ Редактировать</button>
                        <button type="button" class="button_remove_founder" title="Удалить">🗑️ Удалить</button>
                    </div>
                </div>

                <div class="founder-form-content">
                    <button type="button" class="button_remove" title="Удалить" data-jur-person-remove>×</button>
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
                        <div class="field field--short"><label>Доля, %</label><input type="number" step="0.01" data-path="${p}.capitalPercent" class="founder-capital-percent" required></div>
                    </div>

                    <div class="full-width">
                        <label>Адрес (полный):</label>
                        <input type="text" data-path="${p}.address" required>
                    </div>

                    <div class="contact-row">
                        <div><label>Код</label><input type="tel" data-path="${p}.phoneCode" required></div>
                        <div><label>Телефон</label><input type="tel" data-path="${p}.phone" required></div>
                        <div><label>Факс</label><input type="text" data-path="${p}.fax"></div>
                        <div><label>Email</label><input type="email" data-path="${p}.email" required></div>
                    </div>

                    <div class="nested-founders-block jur-founders-inner" data-parent-path="${p}">
                        <p class="nested-founders-title">УЧРЕДИТЕЛИ УКАЗАННОГО ЮРИДИЧЕСКОГО ЛИЦА:</p>
                        <div class="nested-founders-list" data-owner-path="${p}"></div>
                        <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${p}">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</div>
                        <div class="nested-founders-actions">
                            <button type="button" class="button_add_nested" data-add-nested-jur>+ Юр. лицо</button>
                            <button type="button" class="button_add_nested" data-add-nested-fiz>+ Физ. лицо</button>
                        </div>
                    </div>

                    <div class="form-footer-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                        <button type="button" class="btn-save-founder" style="background: #28a745; color: white; padding: 10px 20px; border: none; cursor: pointer;">Добавить</button>
                        <button type="button" class="btn-cancel-founder" style="background: #dc3545; color: white; padding: 10px 20px; border: none; cursor: pointer;">Отмена</button>
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
            }
        }

        const iconEl = card.querySelector('.founder-preview .founder-icon');
        if (iconEl) iconEl.textContent = isStateOrg ? STATE_ORG_ICON : JUR_ICON;
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

        const inputs = list.querySelectorAll(':scope > .nested-founder-item > .nested-founder-fields > .row > .field > .founder-capital-percent');
        let total = 0;
        inputs.forEach(input => total += parseFloat(input.value) || 0);

        total = Math.round(total * 100) / 100;

        sumEl.setAttribute('data-sum', total);
        sumEl.textContent = total === 100 ? '100% ---- ВСЕ УЧРЕДИТЕЛИ ВВЕДЕНЫ' :
            total > 100 ? `${total}% ---- ПРЕВЫШЕНИЕ 100%!` : `${total}% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ`;

        sumEl.classList.toggle('founders-sum--complete', total === 100);
        sumEl.classList.toggle('founders-sum--incomplete', total !== 100);
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
        }));

        document.addEventListener('click', (e) => {
            const target = e.target;
            const card = target.closest('.card-jur-founder');

            if (card) {
                if (target.classList.contains('btn-save-founder')) {
                    if (validateFounderForm(card)) {
                        toggleState(card, 'saved');
                        if (FILLER_LIST) FILLER_LIST.style.display = 'none';
                    } else {
                        card.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                if (target.classList.contains('btn-cancel-founder') || target.closest('[data-jur-person-remove]')) {
                    if (card.getAttribute('data-state') === 'editing' && !card.querySelector('[data-path$=".name"]')?.value) {
                        card.remove();
                        reindexAll();
                        checkContainersAndFiller();
                    } else {
                        toggleState(card, 'saved');
                    }
                    return;
                }

                if (target.closest('.button_edit_founder')) {
                    toggleState(card, 'editing');
                    return;
                }

                if (target.closest('.button_remove_founder')) {
                    card.remove();
                    reindexAll();
                    checkContainersAndFiller();
                    return;
                }
            }

            if (target.closest('[data-nested-founder-remove]')) {
                const item = target.closest('.nested-founder-item');
                removeNestedFounder(item);
            }

            if (target.closest('.button_add_nested') && !target.closest('#office-owners-container')) {
                const btn = target.closest('.button_add_nested');
                const block = btn.closest('.nested-founders-block');
                if (!block || !container.contains(block)) return;
                const list = getBlockElements(block).list;
                const type = btn.hasAttribute('data-add-nested-jur') ? 'jur' : 'fiz';
                const parentPath = block.getAttribute('data-parent-path');
                const index = list.querySelectorAll(':scope > .nested-founder-item').length;

                list.insertAdjacentHTML('beforeend', buildNestedItem(parentPath, index, type));
                updateSum(block);
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


    // Вложенные собственники (внутри юр. лица) — без карточки, как в jur_person_founder
    function buildNestedItem(parentPath, index, type) {
        const path = `${parentPath}.${SEGMENT}.${index}`;
        const isJur = type === 'jur';
        const radioName = 'officeState_' + path.replace(/\./g, '_');

        return `
            <div class="nested-founder-item ${isJur ? 'nested-founder-jur' : 'nested-founder-fiz'}" data-founder-path="${path}">
                <button type="button" class="button_remove button_remove--small" title="Удалить" data-office-owner-item-remove>×</button>
                <span class="nested-founder-icon ${isJur ? 'nested-founder-icon--jur' : 'nested-founder-icon--fiz'}" title="${isJur ? 'Юр. лицо' : 'Физ. лицо'}">
                    ${isJur ? JUR_ICON : '👤'}
                </span>
                <div class="nested-founder-fields">
                    <input type="hidden" data-path="${path}.typeFace" value="${isJur ? 'jurFace' : 'fizFace'}">
                    ${isJur ? `
                    <p class="subtitle">Является ли государственным органом?</p>
                    <div class="inline-options">
                        <label><input type="radio" name="${radioName}" value="true" data-path="${path}.isState"> Да</label>
                        <label><input type="radio" name="${radioName}" value="false" data-path="${path}.isState" checked="checked"> Нет</label>
                    </div>` : ''}
                    <div class="full-width">
                        <label>${isJur ? 'Полное наименование юридического лица' : 'Фамилия, имя, отчество'}</label>
                        <input type="text" data-path="${path}.name" placeholder="${isJur ? 'Наименование' : 'ФИО'}" required>
                    </div>
                    <div class="row">
                        <div class="field">
                            <label>${isJur ? 'Резидент какой страны' : 'Гражданство'}</label>
                            <select data-path="${path}.country" required>${COUNTRY_OPTIONS}</select>
                        </div>
                        <div class="field field--short">
                            <label>Доля, %</label>
                            <input type="number" step="0.01" inputmode="decimal" data-path="${path}.capitalPercent" class="founder-capital-percent" required>
                        </div>
                    </div>
                    ${isJur ? `
                    <div class="nested-founders-block" data-parent-path="${path}">
                        <p class="nested-founders-title">УЧРЕДИТЕЛИ УКАЗАННОГО ЮРИДИЧЕСКОГО ЛИЦА:</p>
                        <div class="nested-founders-list" data-owner-path="${path}"></div>
                        <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${path}">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</div>
                        <div class="nested-founders-actions">
                            <button type="button" class="button_add_nested" data-add-office-nested-jur>+ Юр. лицо</button>
                            <button type="button" class="button_add_nested" data-add-office-nested-fiz>+ Физ. лицо</button>
                        </div>
                    </div>` : ''}
                </div>
            </div>`;
    }

    // Корневой уровень (office.owners) — карточка с превью и кнопками Добавить/Отмена/Редактировать, как physical/jur founder
    function buildRootOwnerItem(index, type) {
        const path = `${BASE_PATH}.${SEGMENT}.${index}`;
        const isJur = type === 'jur';
        const radioName = 'officeState_' + path.replace(/\./g, '_');

        return `
            <div class="nested-founder-item ${isJur ? 'nested-founder-jur' : 'nested-founder-fiz'}" data-founder-path="${path}" data-state="editing">
                <div class="office-owner-preview founder-preview" style="display: none;">
                    <div class="founder-preview-info">
                        <span class="founder-icon">${isJur ? JUR_ICON : '👤'}</span>
                        <span class="founder-name-text">Новый собственник</span>
                    </div>
                    <div class="founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать">✏️ Редактировать</button>
                        <button type="button" class="button_remove_founder" title="Удалить">🗑️ Удалить</button>
                    </div>
                </div>
                <div class="nested-founder-fields office-owner-form">
                    <button type="button" class="button_remove button_remove--small" title="Удалить" data-office-owner-item-remove>×</button>
                    <span class="nested-founder-icon ${isJur ? 'nested-founder-icon--jur' : 'nested-founder-icon--fiz'}" title="${isJur ? 'Юр. лицо' : 'Физ. лицо'}">
                        ${isJur ? JUR_ICON : '👤'}
                    </span>
                    <div class="nested-founder-fields-inner">
                        <input type="hidden" data-path="${path}.typeFace" value="${isJur ? 'jurFace' : 'fizFace'}">
                        ${isJur ? `
                        <p class="subtitle">Является ли государственным органом?</p>
                        <div class="inline-options">
                            <label><input type="radio" name="${radioName}" value="true" data-path="${path}.isState"> Да</label>
                            <label><input type="radio" name="${radioName}" value="false" data-path="${path}.isState" checked="checked"> Нет</label>
                        </div>` : ''}
                        <div class="full-width">
                            <label>${isJur ? 'Полное наименование юридического лица' : 'Фамилия, имя, отчество'}</label>
                            <input type="text" data-path="${path}.name" placeholder="${isJur ? 'Наименование' : 'ФИО'}" required>
                        </div>
                        <div class="row">
                            <div class="field">
                                <label>${isJur ? 'Резидент какой страны' : 'Гражданство'}</label>
                                <select data-path="${path}.country" required>${COUNTRY_OPTIONS}</select>
                            </div>
                            <div class="field field--short">
                                <label>Доля, %</label>
                                <input type="number" step="0.01" inputmode="decimal" data-path="${path}.capitalPercent" class="founder-capital-percent" required>
                            </div>
                        </div>
                        ${isJur ? `
                        <div class="nested-founders-block" data-parent-path="${path}">
                            <p class="nested-founders-title">УЧРЕДИТЕЛИ УКАЗАННОГО ЮРИДИЧЕСКОГО ЛИЦА:</p>
                            <div class="nested-founders-list" data-owner-path="${path}"></div>
                            <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${path}">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</div>
                            <div class="nested-founders-actions">
                                <button type="button" class="button_add_nested" data-add-office-nested-jur>+ Юр. лицо</button>
                                <button type="button" class="button_add_nested" data-add-office-nested-fiz>+ Физ. лицо</button>
                            </div>
                        </div>` : ''}
                        <div class="form-footer-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                            <button type="button" class="btn-save-founder" style="background: #28a745; color: white; padding: 10px 20px; border: none; cursor: pointer;">Добавить</button>
                            <button type="button" class="btn-cancel-founder" style="background: #dc3545; color: white; padding: 10px 20px; border: none; cursor: pointer;">Отмена</button>
                        </div>
                    </div>
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
                    <div class="founders-sum founders-sum--incomplete" data-sum="0" data-owner-path="${BASE_PATH}">0% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ</div>
                    <div class="nested-founders-actions" style="display:none;"></div>
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
            const inp = item.querySelector('.nested-founder-fields-inner > .row > .field > .founder-capital-percent')
                || item.querySelector('.nested-founder-fields > .row > .field > .founder-capital-percent');
            if (inp) total += parseFloat(inp.value) || 0;
        });
        total = Math.round(total * 100) / 100;

        sumEl.setAttribute('data-sum', total);
        sumEl.textContent = total === 100 ? '100% ---- ВСЕ УЧРЕДИТЕЛИ ВВЕДЕНЫ' : 
                           total > 100 ? `${total}% ---- ПРЕВЫШЕНИЕ 100%!` : `${total}% ---- ДОБАВЬТЕ УЧРЕДИТЕЛЯ`;
        
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
        const stateRadioYes = item.querySelector('input[type="radio"][data-path$=".isState"][value="true"]');
        const isStateOrg = !!stateRadioYes?.checked;

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

        const iconEl = item.querySelector('.nested-founder-icon');
        if (iconEl && item.classList.contains('nested-founder-jur')) {
            iconEl.textContent = isStateOrg ? STATE_ORG_ICON : JUR_ICON;
        }
        const previewIcon = item.querySelector('.office-owner-preview .founder-icon');
        if (previewIcon && item.classList.contains('nested-founder-jur')) {
            previewIcon.textContent = isStateOrg ? STATE_ORG_ICON : JUR_ICON;
        }
    }

    function validateOfficeOwnerItem(item) {
        const fields = item.querySelectorAll('.nested-founder-fields-inner [data-path]');
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

    function toggleStateOfficeOwner(item, state) {
        const preview = item.querySelector('.office-owner-preview');
        const form = item.querySelector('.nested-founder-fields.office-owner-form');
        const nameInput = item.querySelector('[data-path$=".name"]');
        const nameDisplay = item.querySelector('.office-owner-preview .founder-name-text');
        if (!preview || !form) return;
        if (state === 'saved') {
            if (nameDisplay) nameDisplay.textContent = nameInput?.value?.trim() || 'Без имени';
            updateOwnerStateOrgUI(item);
            preview.style.display = 'flex';
            form.style.display = 'none';
            item.setAttribute('data-state', 'saved');
        } else {
            preview.style.display = 'none';
            form.style.display = '';
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
            reindexRecursive(item, `${BASE_PATH}.${SEGMENT}.${idx}`);
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
                const root = getRootBlock();
                const { list } = getBlockElements(root);
                const index = list.querySelectorAll(':scope > .nested-founder-item').length;
                list.insertAdjacentHTML('beforeend', buildRootOwnerItem(index, type));
                const newItem = list.querySelector(`:scope > .nested-founder-item:last-child`);
                if (newItem) updateOwnerStateOrgUI(newItem);
                updateSum(root);
                updateRootVisibility();
            }

            if (target.closest('[data-office-owner-item-remove]')) {
                removeOwner(target.closest('.nested-founder-item'));
            }

            const officeItem = target.closest('.nested-founder-item');
            if (officeItem && container.contains(officeItem)) {
                if (target.classList.contains('btn-save-founder')) {
                    if (validateOfficeOwnerItem(officeItem)) {
                        toggleStateOfficeOwner(officeItem, 'saved');
                        const block = officeItem.closest('.nested-founders-block');
                        if (block) updateSum(block);
                    } else {
                        officeItem.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
                if (target.classList.contains('btn-cancel-founder')) {
                    const nameInput = officeItem.querySelector('[data-path$=".name"]');
                    if (!nameInput?.value?.trim()) {
                        removeOwner(officeItem);
                    } else {
                        toggleStateOfficeOwner(officeItem, 'saved');
                    }
                }
                if (target.closest('.button_edit_founder')) {
                    toggleStateOfficeOwner(officeItem, 'editing');
                }
                if (target.closest('.button_remove_founder')) {
                    removeOwner(officeItem);
                }
            }

            const addNestedBtn = target.closest('.button_add_nested');
            if (addNestedBtn && addNestedBtn.closest('#' + CONTAINER_ID)) {
                const block = addNestedBtn.closest('.nested-founders-block');
                const { list } = getBlockElements(block);
                const type = addNestedBtn.hasAttribute('data-add-office-nested-jur') ? 'jur' : 'fiz';
                const parentPath = block.getAttribute('data-parent-path');
                const index = list.querySelectorAll(':scope > .nested-founder-item').length;

                list.insertAdjacentHTML('beforeend', buildNestedItem(parentPath, index, type));
                const newItem = list.querySelector(`:scope > .nested-founder-item:last-child`);
                if (newItem) updateOwnerStateOrgUI(newItem);
                updateSum(block);
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('founder-capital-percent')) {
                const block = e.target.closest('.nested-founders-block');
                if (block && container.contains(block)) {
                    updateSum(block);
                }
            }

            if (e.target.matches && e.target.matches('#' + CONTAINER_ID + ' input[type="radio"][data-path$=".isState"]')) {
                const item = e.target.closest('.nested-founder-item');
                if (item && container.contains(item)) {
                    updateOwnerStateOrgUI(item);
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
        <button type="button" class="button_remove" title="Удалить" aria-label="Удалить" data-domain-owner-remove>×</button>

        <div class="row">
          <div>
            <label>${isFiz ? 'Фамилия, собственное имя, отчество (если таковое имеется) гражданина' : 'Полное наименование юридического лица'}</label>
            <input type="text" data-path="domainOwner.name">
          </div>
          <div>
            <label>Резидент какой страны</label>
            <input type="text" data-path="domainOwner.country">
          </div>
        </div>

        ${isFiz ? '' : `
          <div class="full-width">
            <label>Доля иностранного участия в уставном фонде, %</label>
            <input type="number" data-path="domainOwner.capitalPercent"  data-validate="percent">
          </div>
        `}

        <div class="full-width">
          <label>Адрес (почтовый индекс, область, район, город, населенный пункт, улица, номер дома, корпус, квартира/офис)</label>
          <input type="text" data-path="domainOwner.address">
        </div>

        <label>Контактный телефон</label>
        <div class="row">
          <div>
            <label>Код:</label>
            <input type="tel" inputmode="numeric" data-path="domainOwner.phoneCode">
          </div>
          <div>
            <label>Телефон:</label>
            <input type="tel" data-path="domainOwner.phone">
          </div>
          <div>
            <label>Факс</label>
            <input type="text" data-path="domainOwner.fax">
          </div>
          <div>
            <label>Адрес электронной почты</label>
            <input type="email" data-path="domainOwner.email">
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
            <div class="card card-sponsor" data-sponsor-index="${index}" data-state="editing">
                <div class="founder-preview" style="display: none;">
                    <div class="founder-preview-info">
                        <span class="founder-icon">${isFiz ? '👤' : '💼'}</span>
                        <span class="founder-name-text">Новый спонсор</span>
                    </div>
                    <div class="founder-preview-actions">
                        <button type="button" class="button_edit_founder" title="Редактировать">✏️ Редактировать</button>
                        <button type="button" class="button_remove_founder" title="Удалить">🗑️ Удалить</button>
                    </div>
                </div>

                <div class="sponsor-form-content">
                    <button type="button" class="button_remove" title="Удалить" data-sponsor-remove>×</button>
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
                            <input type="number" step="0.01" inputmode="decimal" data-path="${p}.shareInCapital" required>
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
                            <input type="number" step="0.01" inputmode="decimal" data-path="${p}.shareInCapital" required>
                        </div>
                    </div>
                    `}

                    <p class="subtitle">ФОРМА УЧАСТИЯ В ФИНАНСИРОВАНИИ:</p>
                    <p class="form-hint">ВНИМАНИЕ! Оставьте заполненным по умолчанию или введите другую форму финансирования</p>
                    <div class="full-width">
                        <textarea data-path="${p}.participationForm" rows="4"></textarea>
                    </div>

                    <div class="form-footer-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                        <button type="button" class="btn-save-founder" style="background: #28a745; color: white; padding: 10px 20px; border: none; cursor: pointer;">Добавить</button>
                        <button type="button" class="btn-cancel-founder" style="background: #dc3545; color: white; padding: 10px 20px; border: none; cursor: pointer;">Отмена</button>
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
                return;
            }

            const removeBtn = e.target.closest('[data-sponsor-remove]');
            if (removeBtn) {
                const card = removeBtn.closest('.card-sponsor');
                if (card) {
                    if (card.getAttribute('data-state') === 'editing' && !card.querySelector('[data-path$=".name"]')?.value) {
                        card.remove();
                        reindexSponsors();
                    } else {
                        toggleSponsorState(card, 'saved');
                    }
                }
                return;
            }

            const sponsorCard = e.target.closest('.card-sponsor');
            if (!sponsorCard) return;

            if (e.target.classList.contains('btn-save-founder')) {
                if (validateSponsorForm(sponsorCard)) {
                    toggleSponsorState(sponsorCard, 'saved');
                } else {
                    sponsorCard.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            if (e.target.classList.contains('btn-cancel-founder')) {
                if (sponsorCard.getAttribute('data-state') === 'editing' && !sponsorCard.querySelector('[data-path$=".name"]')?.value) {
                    sponsorCard.remove();
                    reindexSponsors();
                } else {
                    toggleSponsorState(sponsorCard, 'saved');
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

