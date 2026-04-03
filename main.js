let currentName = '';
const send_url = 'generate_pdf.php';
function updateName(value) {
    currentName = value;
    document.getElementById("person_name").textContent = currentName;
}
function handleKindSmiOtherChange(selectEl) {
    const otherInput = document.querySelector('input[data-path="mainInfo.kindSmiOther"]');
    if (!otherInput || !selectEl) return;

    if (selectEl.value === 'Другое') {
        otherInput.disabled = false;
        otherInput.setAttribute('required', '');
    } else {
        otherInput.value = '';
        otherInput.disabled = true;
        otherInput.removeAttribute('required');
        clearFieldError(otherInput);
    }
}

function toggleActive(target){
    let elem = document.getElementById(target);
    elem.disabled = !elem.disabled
    if (!elem.disabled) {
        elem.setAttribute('required', '');
    } else {
        elem.removeAttribute('required');
        clearFieldError(elem);
    }
}

(function () {
    const steps = Array.from(document.querySelectorAll('.step'));
    const prevBtn = document.getElementById('prevStep');
    const nextBtn = document.getElementById('nextStep');
    const progress = document.getElementById('stepProgress');

    if (!steps.length || !prevBtn || !nextBtn || !progress) return;

    // Автоматически помечаем поля email/телефона для дальнейшей валидации
    const allDataPathFields = Array.from(
        document.querySelectorAll('[data-path]')
    );

    allDataPathFields.forEach((el) => {
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
            return;
        }
        const path = el.getAttribute('data-path') || '';
        const lowerPath = path.toLowerCase();

        if (lowerPath.endsWith('email')) {
            el.setAttribute('data-validate', 'email');
            if (el.tagName === 'INPUT') {
                el.type = 'email';
            }
        }

        if (lowerPath.endsWith('phonecode')) {
            el.setAttribute('data-validate', 'phoneCode');
            if (el.tagName === 'INPUT') {
                el.type = 'tel';
            }
        }

        if (lowerPath.endsWith('phone') && !lowerPath.endsWith('phonecode')) {
            el.setAttribute('data-validate', 'phone');
            if (el.tagName === 'INPUT') {
                el.type = 'tel';
            }
        }

        // Поля, где ожидаются только цифры — делаем type="number"
        const numericSuffixes = [
            'capitalpercent',
            'bynvolume',
            'shareincapital',
            'circulation',
            'share',
            'percent'
        ];
        if (
            el.tagName === 'INPUT' &&
            numericSuffixes.some((suf) => lowerPath.endsWith(suf))
        ) {
            el.type = 'number';
            el.setAttribute('inputmode', 'numeric');

            // Для процентных полей добавляем отдельный валидатор, но оставляем type="number"
            if (lowerPath.endsWith('percent') || lowerPath.endsWith('bynvolume')) {
                el.setAttribute('data-validate', 'percent');
            }
        }
    });

    function showFieldError(el, message) {
        el.classList.add('input-error');

        let msg = el.nextElementSibling;
        if (!msg || !msg.classList || !msg.classList.contains('input-error-text')) {
            msg = document.createElement('div');
            msg.className = 'input-error-text';
            el.parentNode.insertBefore(msg, el.nextSibling);
        }
        msg.textContent = message;
    }

    function validateField(el) {
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
            return true;
        }

        // Как и при сборе JSON (buildJsonFromForm): не валидируем поля в отключённых блоках
        if (el.closest('[data-ignore-container]')) {
            clearFieldError(el);
            return true;
        }

        clearFieldError(el);

        const isSelect = el instanceof HTMLSelectElement;
        const value = isSelect
            ? (el.multiple
                ? (() => {
                    const selected = Array.from(el.selectedOptions || []);
                    const meaningful = selected.filter((opt) => !opt.disabled && String(opt.value || '').trim() !== '');
                    return meaningful.length ? '__selected__' : '';
                })()
                : (el.value || '')
            )
            : (el.value || '').trim();
        const validator = el.getAttribute('data-validate');

        // Пустое значение считаем допустимым, если поле не обязательно
        const isRequired =
            el.hasAttribute('required') ||
            el.getAttribute('data-required') === 'true';

        if (isRequired && !value) {
            showFieldError(el, 'Поле обязательно для заполнения');
            return false;
        }

        // Для select больше ничего дополнительно не проверяем
        if (isSelect) {
            return true;
        }

        if (!value) {
            return true;
        }

        if (validator === 'email') {
            const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRe.test(value)) {
                showFieldError(el, 'Укажите корректный адрес электронной почты');
                return false;
            }
        }

        if (validator === 'phone') {
            const phoneRe = /^[0-9+()\-\s]{5,}$/;
            if (!phoneRe.test(value)) {
                showFieldError(el, 'Укажите корректный номер телефона');
                return false;
            }
        }

        if (validator === 'phoneCode') {
            const codeRe = /^\d{2,6}$/;
            if (!codeRe.test(value)) {
                showFieldError(el, 'Укажите корректный код города (2–6 цифр)');
                return false;
            }
        }

        if (validator === 'percent') {
            const maxPercent = parseFloat(el.dataset.maxPercent) || 100;

            const num = Number(value.replace(',', '.'));
            if (!Number.isFinite(num) || num < 0 || num > maxPercent) {
                if(maxPercent == 100){
                    showFieldError(el, `Укажите значение от 0 до 100`);
                }else{
                    showFieldError(el, `Для этого поля диапазон значений ревен от 0 до ${maxPercent}`);
                }
                return false;
            }
        }

        // Общая проверка для числовых полей без спец‑валидаторов
        if (!validator && el.type === 'number') {
            const num = Number(value.replace(',', '.'));
            if (!Number.isFinite(num)) {
                showFieldError(el, 'Укажите корректное числовое значение');
                return false;
            }
        }

        return true;
    }

    function validateStep(index) {
        const step = steps[index];
        if (!step) return true;

        const fields = Array.from(
            step.querySelectorAll('[data-validate], [data-required="true"], [required]')
        );

        let allValid = true;
        fields.forEach((el) => {
            const valid = validateField(el);
            if (!valid) {
                allValid = false;
            }
        });

        if (!allValid) {
            const firstInvalid = fields.find((el) =>
                el.classList.contains('input-error')
            );
            if (firstInvalid && typeof firstInvalid.scrollIntoView === 'function') {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        if(allValid) {
            allValid = additionalStepValidate(index,step);
        }

        return allValid;
    }

    function additionalStepValidate(index,step) {
        let valid = true;
        index++;
        switch (index) {
            case 2:
                valid = addValStep2(step);
                break;
            case 3:
                valid = addValStep3(step);
                break;
            case 4:
                valid = addValStep4(step);
                break;
            case 5:
                valid = addValStep5(step);
                break;
            case 6:
                valid = addValStep6(step);
                break;
        }
        return valid;
    }

    function addValStep4(activeStep) {
        const select = activeStep.querySelector(
            'select[data-path="mainInfo.specialization"][multiple]'
        );
        if (!select) return true;

        const otherEnabled = !!activeStep.querySelector(
            'input[type="checkbox"][data-path="mainInfo.specializationOtherEnabled"]:checked'
        );
        const otherInput = activeStep.querySelector(
            'input[data-path="mainInfo.specializationOther"]'
        );

        const hasSelected = (() => {
            const selected = Array.from(select.selectedOptions || []);
            const meaningful = selected.filter(
                (opt) => !opt.disabled && String(opt.value || '').trim() !== ''
            );
            return meaningful.length > 0;
        })();
        const hasOtherText =
            otherEnabled && otherInput && String(otherInput.value || '').trim() !== '';

        if (hasSelected || hasOtherText) {
            // Если выбор сделан — чистим ошибку на видимом поле поиска (если оно есть).
            const wrap = select.parentNode?.querySelector('.multi-select-wrap');
            const input = wrap ? wrap.querySelector('.multi-select-input') : null;
            if (input) {
                clearFieldError(input);
            } else {
                clearFieldError(select);
            }
            return true;
        }

        const wrap = select.parentNode?.querySelector('.multi-select-wrap');
        const input = wrap ? wrap.querySelector('.multi-select-input') : null;
        const target = input || select;

        showFieldError(
            target,
            'Укажите специализацию: выберите из списка или заполните «Другая».'
        );
        if (typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (input && typeof input.focus === 'function') {
            try {
                input.focus({ preventScroll: true });
            } catch (_) {
                input.focus();
            }
        }
        return false;
    }

    function addValStep2(){
        const founderEl = document.getElementById('founder');
        const founder_type = founderEl && founderEl.hasAttribute('data-ignore-container')
            ? 'domain_owner'
            : 'founder';
        const w = document.getElementById('err_block');

        if (founder_type === 'founder') {
            const p = document.getElementById('physical-person-founders-container');
            const j = document.getElementById('jur-person-founders-container');
            const innText =
                ((p && p.innerText) || '').trim() + ((j && j.innerText) || '').trim();

            if (innText === '') {
                if (w) {
                    showFieldError(w, 'необходимо заполнить реквизиты учредителей');
                    w.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return false;
            }

            const unsavedCard =
                (p && p.querySelector('.card-physical-founder[data-state="editing"]')) ||
                (j && j.querySelector('.card-jur-founder[data-state="editing"]'));
            if (unsavedCard) {
                if (w) {
                    showFieldError(
                        w,
                        'Заполните карточку и сохраните учредителя кнопкой «Добавить учредителя сми» либо отмените ввод кнопкой «Отменить».'
                    );
                }
                if (typeof unsavedCard.scrollIntoView === 'function') {
                    unsavedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return false;
            }

            if (w) clearFieldError(w);
            return true;
        }

        const d = document.getElementById('domain-owner-container');
        const innText = ((d && d.innerText) || '').trim();
        if (innText === '') {
            if (w) {
                showFieldError(w, 'необходимо заполнить владельца сетевого издания');
                w.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
        if (w) clearFieldError(w);
        return true;
    }

    function addValStep3(activeStep){
        let valid = addValStep3MeetsLegalRqmts(activeStep);
        if (!valid) {
            return false;
        }

        valid = addValStep3Owners(activeStep);
        if (!valid) {
            return false;
        }

        valid = addVelStep3MeetRequirements(activeStep);
        if (!valid) {
            return false;
        }
        return valid;
    }

    function addValStep3MeetsLegalRqmts(activeStep){
        const elem = activeStep.querySelector(
            'input[data-path="office.meetsLegalRqmts"]:checked'
        );
        if (!elem) {
            return true;
        }
        const err_block = elem.parentElement.parentElement;
        if (elem.value === 'false') {
            showFieldError(err_block, "помещение должно соответствовать требованиям законодательства");
            if (err_block && typeof err_block.scrollIntoView === 'function') {
                err_block.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
        clearFieldError(err_block);
        return true;
    }

    function addValStep3Owners(activeStep){
        const container = document.getElementById('office-owners-container');
        const errEl = document.getElementById('office-owners-err');
        if (!container || !errEl) return true;

        const rootBlock = container.querySelector('.nested-founders-block[data-parent-path="office"]');
        if (!rootBlock) {
            showFieldError(errEl, 'Необходимо добавить хотя бы одного собственника имущества');
            if (typeof errEl.scrollIntoView === 'function') {
                errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        const list = rootBlock.querySelector('.nested-founders-list[data-owner-path="office"]');
        const items = list ? list.querySelectorAll(':scope > .nested-founder-item') : [];
        if (items.length === 0) {
            showFieldError(errEl, 'Необходимо добавить хотя бы одного собственника имущества');
            if (typeof errEl.scrollIntoView === 'function') {
                errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        function getBlockSum(block) {
            if (!block) return NaN;
            const listEl = block.querySelector('.nested-founders-list');
            if (!listEl) return NaN;
            const itemsEl = listEl.querySelectorAll(':scope > .nested-founder-item');
            let total = 0;
            itemsEl.forEach(item => {
                const inp = item.querySelector('.founder-capital-percent');
                if (inp) total += parseFloat(inp.value) || 0;
            });
            return Math.round(total * 100) / 100;
        }

        const rootSum = getBlockSum(rootBlock);
        if (rootSum !== 100) {
            showFieldError(errEl, 'Сумма долей всех собственников должна быть ровно 100%');
            if (typeof errEl.scrollIntoView === 'function') {
                errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        function checkNestedBlocksRecursive(block) {
            if (!block) return true;
            const listEl = block.querySelector(':scope > .nested-founders-list');
            if (!listEl) return true;
            const blockItems = listEl.querySelectorAll(':scope > .nested-founder-item');
            for (let i = 0; i < blockItems.length; i++) {
                const item = blockItems[i];
                if (!item.classList.contains('nested-founder-jur')) continue;
                const stateHidden = item.querySelector('input[type="hidden"][data-path$=".isState"]');
                if (stateHidden?.value === 'true') continue;
                const nestedBlock = item.querySelector(':scope > .nested-founder-fields > .nested-founder-fields-inner > .nested-founders-block:not([data-ignore-container])')
                    || item.querySelector(':scope > .nested-founder-fields > .nested-founders-block:not([data-ignore-container])');
                if (!nestedBlock) continue;
                const nestedSum = getBlockSum(nestedBlock);
                if (nestedSum !== 100) return false;
                if (!checkNestedBlocksRecursive(nestedBlock)) return false;
            }
            return true;
        }

        if (!checkNestedBlocksRecursive(rootBlock)) {
            showFieldError(errEl, 'Сумма долей вложенных учредителей каждого юридического лица (кроме госоргана) должна быть ровно 100%');
            if (typeof errEl.scrollIntoView === 'function') {
                errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        clearFieldError(errEl);
        return true;
    }

    function addVelStep3MeetRequirements(activeStep){
        const elem = activeStep.querySelector(
            'input[data-path="office.chiefEditor.meetRequirements"]:checked'
        );
        if (!elem) {
            return true;
        }
        const err_block = elem.parentElement.parentElement;
        if (elem.value === 'false') {
            showFieldError(err_block, "главный редактор должен соответствовать квалификационным требованиям");
            if (err_block && typeof err_block.scrollIntoView === 'function') {
                err_block.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
        clearFieldError(err_block);
        return true;
    }
    
    function addValStep5(activeStep){
        let valid = addValStep5Checkboxes(activeStep);
        if(!valid){
            return false;
        }
        valid = addValStep5Sponsors();
        return valid;
    }

    function addValStep5Checkboxes(activeStep){
        const elem = activeStep.querySelector(
            'input[data-path="financingMeetsLegalRqmts"]:checked'
        );
        if (!elem) {
            return true;
        }
        const err_block = elem.parentElement && elem.parentElement.parentElement;
        if (elem.value === 'false') {
            showFieldError(err_block, "главный редактор должен соответствовать квалификационным требованиям");
            if (err_block && typeof err_block.scrollIntoView === 'function') {
                err_block.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
        clearFieldError(err_block);
        return true;
    }

    function addValStep5Sponsors(){
        let container = document.getElementById('sponsors-container');
        let err_block = container.nextElementSibling;
        if(container.innerText.trim() === ""){
            showFieldError(err_block, "необходимо заполнить источнки поступления средств");
            return false;
        }else{
            clearFieldError(err_block);
        }
        return true;
    }

    function addValStep6(activeStep){
        let input = activeStep.querySelector("input:checked");
        let err_block = activeStep.querySelector(".inline-options");
        if(!input){
            return false;
        }
        if(input.value === 'false'){
            showFieldError(err_block, "необходимо подтвердить, что все введенные данные верны и соответствуют действительности");
            return false;
        }else{
            clearFieldError(err_block)
        }
        return true;
    }

    function validateAllSteps() {
        for (let i = 0; i < steps.length; i += 1) {
            const valid = validateStep(i);
            if (!valid) {
                showStep(i, { scroll: true });
                return false;
            }
        }
        return true;
    }

    document.addEventListener('focusout', (e) => {
        const target = e.target;
        if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement
        ) {
            if (
                target.hasAttribute('data-validate') ||
                target.getAttribute('data-required') === 'true' ||
                target.hasAttribute('required')
            ) {
                validateField(target);
            }
        }
    });

    // Для select пересчитываем ошибку сразу при смене значения
    document.addEventListener('change', (e) => {
        const target = e.target;
        if (target instanceof HTMLSelectElement) {
            if (
                target.hasAttribute('data-validate') ||
                target.getAttribute('data-required') === 'true' ||
                target.hasAttribute('required')
            ) {
                validateField(target);
            }
        }
    });

    // Полностью запрещаем ввод e/E и лишних знаков в числовые/процентные поля на уровне клавиатуры
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;

        const validator = target.getAttribute('data-validate');

        if (validator === 'percent' && target.type === 'number') {
            const controlKeys = [
                'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Home', 'End'
            ];

            if (controlKeys.includes(e.key)) {
                return;
            }

            if (!/^[0-9.]$/.test(e.key)) {
                e.preventDefault();
                return;
            }

            if (e.key === '.' && target.value.includes('.')) {
                e.preventDefault();
            }
        }
    });

    // Ограничиваем ввод в числовые / процентные поля (чистим то, что попало не с клавиатуры)
    document.addEventListener('input', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;

        const validator = target.getAttribute('data-validate');

        // Проценты: разрешаем цифры и один разделитель (точка/запятая)
        if (validator === 'percent') {
            let v = target.value;
            const orig = v;
            v = v.replace(/[^0-9.,]/g, '');
            // оставляем только один разделитель
            const parts = v.split(/[.,]/);
            if (parts.length > 1) {
                v = parts[0] + '.' + parts.slice(1).join('');
            }
            if (v !== orig) {
                const pos = target.selectionStart || v.length;
                target.value = v;
                if (typeof target.setSelectionRange === 'function') {
                    target.setSelectionRange(pos, pos);
                }
            }
            return;
        }

        // Телефон: цифры, +, пробел, скобки и дефис
        if (validator === 'phone') {
            const orig = target.value;
            const filtered = orig.replace(/[^0-9()\-\s]/g, '');
            if (filtered !== orig) {
                const pos = target.selectionStart || filtered.length;
                target.value = filtered;
                if (typeof target.setSelectionRange === 'function') {
                    target.setSelectionRange(pos, pos);
                }
            }
            return;
        }

        // Код города: только цифры
        if (validator === 'phoneCode') {
            const orig = target.value;
            const filtered = orig.replace(/[^0-9+]/g, '')
            if (filtered !== orig) {
                const pos = target.selectionStart || filtered.length;
                target.value = filtered;
                if (typeof target.setSelectionRange === 'function') {
                    target.setSelectionRange(pos, pos);
                }
            }
            return;
        }

        // Обычные числа: только цифры
        if (target.type === 'number' || target.inputMode === 'numeric') {
            const orig = target.value;
            const filtered = orig.replace(/[^0-9]/g, '');
            if (filtered !== orig) {
                const pos = target.selectionStart || filtered.length;
                target.value = filtered;
                if (typeof target.setSelectionRange === 'function') {
                    target.setSelectionRange(pos, pos);
                }
            }
        }
    });

    let current = 0;

    function clampIndex(i) {
        return Math.max(0, Math.min(steps.length - 1, i));
    }

    function showStep(i, { scroll = true } = {}) {
        current = clampIndex(i);
        steps.forEach((el, idx) => {
            el.classList.toggle('active', idx === current);
        });

        progress.textContent = `ШАГ ${current + 1} из ${steps.length}`;
        prevBtn.disabled = current === 0;
        nextBtn.textContent = current === steps.length - 1 ? 'Отправить заявление на регистрацию' : 'дальше';

        if (scroll) {
            steps[current].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        history.replaceState(null, '', `#step-${current + 1}`);
    }

    prevBtn.addEventListener('click', () => showStep(current - 1));
    nextBtn.addEventListener('click', async () => {

        // Перед переходом дальше валидируем текущий шаг
        if (!validateStep(current)) {
            return;
        }
        if (current === steps.length - 1) {
            await sendData();
            return;
        }

        showStep(current + 1);
    });

    window.addEventListener('hashchange', () => {
        const m = location.hash.match(/#step-(\d+)/);
        if (!m) return;
        const idx = parseInt(m[1], 10) - 1;
        if (!Number.isFinite(idx)) return;
        showStep(idx, { scroll: false });
    });

    const initialMatch = location.hash.match(/#step-(\d+)/);
    const initialIdx = initialMatch ? (parseInt(initialMatch[1], 10) - 1) : 0;
    showStep(initialIdx, { scroll: false });

    // Делаем функцию проверки всех шагов доступной снаружи
    window._validateAllSteps = validateAllSteps;
    window.validateField = validateField;
    window.steps = {};
    window.steps.addValStep3 = addValStep3.bind(this);
    window.steps.addValStep3MeetsLegalRqmts = addValStep3MeetsLegalRqmts.bind(this);
    window.steps.addVelStep3MeetRequirements = addVelStep3MeetRequirements.bind(this);
    window.steps.addValStep5 = addValStep5.bind(this);
    window.steps.addValStep5Checkboxes = addValStep5Checkboxes.bind(this);
    window.steps.addValStep5Sponsors = addValStep5Sponsors.bind(this);
    window.steps.addValStep6 = addValStep6.bind(this);

    window._smiShowFieldError = showFieldError;
    window._smiShowStep = showStep;

    window._smiSetSubmitBusy = function (busy) {
        if (!nextBtn || !prevBtn) return;
        if (busy) {
            if (!nextBtn.dataset._smiIdleText) {
                nextBtn.dataset._smiIdleText = nextBtn.textContent;
            }
            nextBtn.disabled = true;
            prevBtn.disabled = true;
            nextBtn.textContent = 'Отправка…';
            nextBtn.classList.add('btn-loading');
        } else {
            nextBtn.disabled = false;
            nextBtn.classList.remove('btn-loading');
            nextBtn.textContent =
                current === steps.length - 1
                    ? 'Отправить заявление на регистрацию'
                    : 'дальше';
            prevBtn.disabled = current === 0;
        }
    };
})();

// Сборка JSON по data-path
function setPath(root, path, value) {
    if (value === '' || value == null) return;

    const parts = path
        .replace(/\]/g, '')
        .split(/\[|\./); // founders[0].name -> ["founders","0","name"]

    let obj = root;
    for (let i = 0; i < parts.length; i++) {
        const key = parts[i];
        const isLast = i === parts.length - 1;

        if (isLast) {
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!Number.isNaN(Number(value)) && value.trim() !== '') {
                value = Number(value);
            }

            const existing = obj[key];
            if (Array.isArray(existing)) {
                existing.push(value);
            } else if (existing !== undefined && existing !== null && existing !== '') {
                obj[key] = [existing, value];
            } else {
                obj[key] = value;
            }
        } else {
            const nextKey = parts[i + 1];
            const isIndex = /^\d+$/.test(nextKey);
            if (!(key in obj)) {
                obj[key] = isIndex ? [] : {};
            }
            obj = obj[key];
        }
    }
}

function buildJsonFromForm(container) {
    let root = {};
    const fields = container.querySelectorAll('[data-path]');

    fields.forEach((el) => {
        if (el.closest('[data-ignore-container]')) {
            return;
        }

        const path = el.getAttribute('data-path');
        if (!path) return;

        const type = el.type;
        if (type === 'radio' || type === 'checkbox') {
            if (!el.checked) return;
            setPath(root, path, el.value || 'true');
        } else if (el instanceof HTMLSelectElement && el.multiple) {
            const selectedValues = Array.from(el.selectedOptions)
                .map((option) => option.value)
                .filter((value) => value !== '');
            selectedValues.forEach((value) => setPath(root, path, value));
        } else {
            setPath(root, path, el.value);
        }
    });

    root = mergeFounders(root);

    return root;
}

function mergeFounders(obj) {
    obj = obj || {};

    const founders = Array.isArray(obj.founders) ? obj.founders : [];

    const foundersPhys = Array.isArray(obj.founders_phys) ? obj.founders_phys : [];

    obj.founders = [...founders, ...foundersPhys];

    if (obj.hasOwnProperty('founders_phys')) {
        delete obj.founders_phys;
    }

    return obj;
}

function _smiEscapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function _smiFlattenServerErrors(errors) {
    const out = [];
    if (!Array.isArray(errors)) return out;
    for (const e of errors) {
        if (typeof e !== 'string') continue;
        e.split(/\s*;\s*/).forEach((part) => {
            const t = part.trim();
            if (t) out.push(t);
        });
    }
    return out;
}

function _smiParseErrorLine(line) {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) return null;
    return { path: m[1].trim(), message: m[2].trim() };
}

function _smiServerPathToDotPath(path) {
    return path.replace(/\[(\d+)\]/g, '.$1');
}

function _smiMergedFoundersDomPrefix(container, mergedIndex) {
    const jurSaved = container.querySelectorAll(
        '#jur-person-founders-container .card-jur-founder[data-state="saved"]'
    );
    const jurCount = jurSaved.length;
    if (mergedIndex < jurCount) {
        return `founders.${mergedIndex}`;
    }
    const physIdx = mergedIndex - jurCount;
    return `founders_phys.${physIdx}`;
}

function _smiMapFoundersRootToDomPath(container, dotPath) {
    const m = /^founders\.(\d+)(.*)$/.exec(dotPath);
    if (!m) return dotPath;
    const idx = parseInt(m[1], 10);
    const rest = m[2] || '';
    const base = _smiMergedFoundersDomPrefix(container, idx);
    return base + rest;
}

function _smiTryFoundersPhysNestedFallback(container, dotPath) {
    if (!dotPath.includes('founders_phys.') || !dotPath.includes('.founders.')) {
        return null;
    }
    const alt = dotPath.replace(/\.founders\./g, '.founders_phys.');
    return container.querySelector(`[data-path="${alt}"]`) ? alt : null;
}

function _smiClearAllFieldErrors(container) {
    if (!container) return;
    container.querySelectorAll('.input-error').forEach((el) => {
        el.classList.remove('input-error');
        const n = el.nextElementSibling;
        if (n && n.classList && n.classList.contains('input-error-text')) {
            n.remove();
        }
    });
}

let _smiToastAutoHideTimer = null;

function _smiDismissToast() {
    const el = document.getElementById('smi-form-toast');
    if (!el) return;
    if (_smiToastAutoHideTimer) {
        clearTimeout(_smiToastAutoHideTimer);
        _smiToastAutoHideTimer = null;
    }
    el.classList.remove('smi-toast--visible');
    el.setAttribute('aria-hidden', 'true');
}

function _smiEnsureFormToast() {
    let el = document.getElementById('smi-form-toast');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'smi-form-toast';
    el.className = 'smi-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
        '<div class="smi-toast__surface">' +
        '<span class="smi-toast__icon smi-toast__icon--error" aria-hidden="true">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' +
        '</span>' +
        '<span class="smi-toast__icon smi-toast__icon--info" aria-hidden="true">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
        '</span>' +
        '<p class="smi-toast__text"></p>' +
        '<button type="button" class="smi-toast__close" aria-label="Закрыть">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '</div>';
    const closeBtn = el.querySelector('.smi-toast__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => _smiDismissToast());
    }
    document.body.appendChild(el);
    return el;
}

function _smiShowFormAlert(_container, kind, message) {
    const el = _smiEnsureFormToast();
    const textEl = el.querySelector('.smi-toast__text');
    if (textEl) textEl.textContent = message;

    if (_smiToastAutoHideTimer) {
        clearTimeout(_smiToastAutoHideTimer);
        _smiToastAutoHideTimer = null;
    }

    el.classList.remove('smi-toast--error', 'smi-toast--info');
    el.classList.add(kind === 'error' ? 'smi-toast--error' : 'smi-toast--info');
    el.setAttribute('aria-hidden', 'false');
    if (kind === 'error') {
        el.setAttribute('role', 'alert');
    } else {
        el.setAttribute('role', 'status');
    }

    el.classList.remove('smi-toast--visible');
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            el.classList.add('smi-toast--visible');
        });
    });

    if (kind !== 'error') {
        _smiToastAutoHideTimer = window.setTimeout(() => {
            _smiDismissToast();
        }, 7000);
    }
}

function _smiHideFormAlert() {
    _smiDismissToast();
}

function _smiPickFocusTarget(el) {
    if (!el) return null;
    if (
        el instanceof HTMLInputElement &&
        (el.type === 'radio' || el.type === 'checkbox')
    ) {
        const path = el.getAttribute('data-path');
        if (path) {
            const group = el
                .closest('.container')
                ?.querySelectorAll(`[data-path="${path.replace(/"/g, '\\"')}"]`);
            if (group && group.length) {
                const checked = Array.from(group).find(
                    (x) => x instanceof HTMLInputElement && x.checked
                );
                return checked || el;
            }
        }
        return el;
    }
    if (
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLInputElement && el.type !== 'hidden')
    ) {
        return el.disabled ? null : el;
    }
    const inner = el.querySelector(
        'input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea'
    );
    if (inner && !inner.disabled) return inner;
    return el;
}

function _smiFocusFieldElement(el) {
    if (!el) return;
    const step = el.closest('.step');
    const steps = Array.from(document.querySelectorAll('.step'));
    const idx = steps.indexOf(step);
    if (idx >= 0 && typeof window._smiShowStep === 'function') {
        window._smiShowStep(idx, { scroll: true });
    }
    const target = _smiPickFocusTarget(el);
    window.requestAnimationFrame(() => {
        (target || el).scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (
            target &&
            typeof target.focus === 'function' &&
            !target.disabled
        ) {
            try {
                target.focus({ preventScroll: true });
            } catch (_) {
                target.focus();
            }
        }
    });
}

function _smiFindElementForDataPath(container, dataPath) {
    if (!dataPath) return null;
    const esc = dataPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    let list = container.querySelectorAll(`[data-path="${esc}"]`);
    if (!list.length) {
        const alt = _smiTryFoundersPhysNestedFallback(container, dataPath);
        if (alt) {
            const escAlt = alt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            list = container.querySelectorAll(`[data-path="${escAlt}"]`);
        }
    }
    if (!list.length && dataPath) {
        const escPref = `${dataPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}.`;
        const byChild = container.querySelector(`[data-path^="${escPref}"]`);
        if (byChild) return byChild;
    }
    if (!list.length && dataPath === 'office.owners') {
        const err = document.getElementById('office-owners-err');
        if (err) return err;
        return container.querySelector('[data-path^="office.owners."]');
    }
    if (!list.length && (dataPath === 'sponsors' || dataPath.startsWith('sponsors'))) {
        const wrap = document.getElementById('sponsors-container');
        if (wrap && wrap.parentElement) return wrap.parentElement;
    }
    if (!list.length && dataPath.startsWith('sponsors.')) {
        const prefEsc = `${dataPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}.`;
        const byPref = container.querySelector(`[data-path^="${prefEsc}"]`);
        if (byPref) return byPref;
    }
    if (!list.length && /^Шаг\s*\d+/i.test(dataPath)) {
        return document.getElementById('err_block');
    }
    if (!list.length && dataPath === 'mainInfo') {
        return container.querySelector('[data-path^="mainInfo."]');
    }
    if (!list.length && dataPath === 'office') {
        return container.querySelector('[data-path^="office."]');
    }
    if (!list.length) {
        const dot = dataPath.indexOf('.');
        const base = dot === -1 ? dataPath : dataPath.slice(0, dot);
        if (base === 'domainOwner') {
            return (
                container.querySelector(`[data-path^="domainOwner."]`) ||
                document.getElementById('domain-owner-container')
            );
        }
    }
    if (!list.length) {
        const m = /^founders\.(\d+)$/.exec(dataPath);
        if (m) {
            const prefix = `founders.${m[1]}.`;
            const escPref = prefix.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const byPref = container.querySelector(`[data-path^="${escPref}"]`);
            if (byPref) return byPref;
        }
        const m2 = /^founders_phys\.(\d+)$/.exec(dataPath);
        if (m2) {
            const prefix = `founders_phys.${m2[1]}.`;
            const escPref = prefix.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            return container.querySelector(`[data-path^="${escPref}"]`);
        }
    }
    const visible = Array.from(list).find(
        (node) =>
            node instanceof HTMLElement &&
            !node.closest('[data-ignore-container]') &&
            node.offsetParent !== null
    );
    return visible || list[0] || null;
}

function _smiResolveDataPathFromServerKey(container, pathKey) {
    const dot = _smiServerPathToDotPath(pathKey);
    if (dot.startsWith('founders.')) {
        return _smiMapFoundersRootToDomPath(container, dot);
    }
    return dot;
}

function _smiApplyServerValidationErrors(container, lines) {
    const showErr =
        typeof window._smiShowFieldError === 'function'
            ? window._smiShowFieldError
            : null;
    if (!showErr) return { focused: false, mapped: 0 };

    let firstEl = null;
    let mapped = 0;

    for (const line of lines) {
        const parsed = _smiParseErrorLine(line);
        if (!parsed) continue;

        const dataPath = _smiResolveDataPathFromServerKey(container, parsed.path);
        const el = _smiFindElementForDataPath(container, dataPath);
        if (el) {
            showErr(el, parsed.message);
            mapped += 1;
            if (!firstEl) firstEl = el;
        }
    }

    if (firstEl) {
        _smiFocusFieldElement(firstEl);
    }

    return { focused: !!firstEl, mapped };
}

function _smiShowSubmitSuccess(container, message) {
    const text = message || 'Заявка успешно принята';
    container.innerHTML =
        '<div class="smi-success" role="status">' +
        '<div class="smi-success__card">' +
        '<div class="smi-success__icon" aria-hidden="true">' +
        '<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="28" r="28" fill="#e8f5e9"/><path d="M16 28.5l8.5 8.5L40 19" stroke="#2e7d32" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        '<h1 class="smi-success__title">Заявление отправлено</h1>' +
        '<p class="smi-success__text">' +
        _smiEscapeHtml(text) +
        '</p>' +
        '<p class="smi-success__hint">Ваша заявка была принята и будет рассмотрена в ближайшее время.</p>' +
        '</div>' +
        '</div>';
    document.title = 'Заявление отправлено';
}

async function sendData() {
    const container = document.querySelector('.container');
    if (!container) return;

    if (typeof window._validateAllSteps === 'function') {
        if (!window._validateAllSteps()) {
            return;
        }
    }

    const data = buildJsonFromForm(container);
    console.log('Собранный JSON:', data);

    _smiHideFormAlert();
    _smiClearAllFieldErrors(container);

    if (typeof window._smiSetSubmitBusy === 'function') {
        window._smiSetSubmitBusy(true);
    }

    try {
        const response = await fetch(send_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const status = response.status;
        const rawText = await response.text();
        let payload = null;
        if (rawText) {
            try {
                payload = JSON.parse(rawText);
            } catch (_) {
                payload = null;
            }
        }

        if (response.ok) {
            const msg =
                payload && typeof payload.message === 'string'
                    ? payload.message
                    : 'Заявка успешно принята';
            _smiShowSubmitSuccess(container, msg);
            return;
        }

        if (typeof window._smiSetSubmitBusy === 'function') {
            window._smiSetSubmitBusy(false);
        }

        const errorsArr =
            payload && Array.isArray(payload.errors) ? payload.errors : [];
        const flat = _smiFlattenServerErrors(errorsArr);

        if (status === 400 && flat.length > 0) {
            const { focused, mapped } = _smiApplyServerValidationErrors(
                container,
                flat
            );
            if (mapped === 0) {
                _smiShowFormAlert(
                    container,
                    'error',
                    flat.join(' ')
                );
            } else if (!focused) {
                _smiShowFormAlert(
                    container,
                    'error',
                    'Данные не прошли проверку. Проверьте выделенные поля.'
                );
            } else {
                _smiShowFormAlert(
                    container,
                    'info',
                    'Данные не прошли проверку. Проверьте выделенные поля.'
                );
            }
            return;
        }

        if (status >= 500) {
            _smiShowFormAlert(
                container,
                'error',
                'Сервис временно недоступен. Что-то пошло не так — попробуйте отправить заявление позже.'
            );
            return;
        }

        const fallback =
            flat.length > 0
                ? flat.join(' ')
                : 'Не удалось обработать ответ сервера. Попробуйте позже.';
        _smiShowFormAlert(container, 'error', fallback);
    } catch (e) {
        console.error(e);
        if (typeof window._smiSetSubmitBusy === 'function') {
            window._smiSetSubmitBusy(false);
        }
        _smiShowFormAlert(
            container,
            'error',
            'Не удалось связаться с сервером. Проверьте подключение к сети и попробуйте позже.'
        );
    }
}

(function () {
    function setupOtherField(radioName, otherInputSelector) {
        const radios = document.querySelectorAll(`input[name="${radioName}"]`);
        const otherInput = document.querySelector(otherInputSelector);

        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                const isOther = radio.checked && radio.value === 'Другое';

                otherInput.disabled = !isOther;

                if (isOther) {
                    otherInput.setAttribute('required', 'required');
                    otherInput.setAttribute('data-required', 'true');
                } else {
                    otherInput.removeAttribute('required');
                    otherInput.removeAttribute('data-required');
                    clearFieldError(otherInput);
                    otherInput.value = '';
                }
            });
        });

        const checkedRadio = document.querySelector(`input[name="${radioName}"]:checked`);
        if (checkedRadio && checkedRadio.value === 'Другое') {
            otherInput.disabled = false;
            otherInput.setAttribute('required', 'required');
            otherInput.setAttribute('data-required', 'true');
        } else {
            otherInput.disabled = true;
            otherInput.removeAttribute('required');
            otherInput.removeAttribute('data-required');
            clearFieldError(otherInput);
        }
    }
    // для территории
    setupOtherField('distributionTerritory', 'input[data-path="mainInfo.distributionTerritoryDetail"]');

    // для периодичности
    setupOtherField('periodicity', 'input[data-path="mainInfo.periodicityOther"]');

    // для максимального объёма вещания
    setupOtherField('volumeVoice', 'input[data-path="mainInfo.volumeVoiceOther"]')
})();
function clearFieldError(el) {
    el.classList.remove('input-error');
    const next = el.nextElementSibling;
    if (next && next.classList && next.classList.contains('input-error-text')) {
        next.remove();
    }
}


function changeFace(type){
    let domainOwner = document.getElementById('domainOwner');
    let founder = document.getElementById('founder');
    if(type === "fizFace"){
        setIgnore(founder);
        removeIgnore(domainOwner);
        show(domainOwner);
        hide(founder);
    }else{
        setIgnore(domainOwner);
        removeIgnore(founder);
        show(founder);
        hide(domainOwner);
    }
}
function setIgnore(el){
    if (!el) return;
    el.setAttribute('data-ignore-container', '');
}
function removeIgnore(el){
    if (!el) return;
    el.removeAttribute('data-ignore-container');
}

function show(el) {
    if (!el) return;
    el.style.display = 'block';
}

function hide(el) {
    if (!el) return;
    el.style.display = 'none';
}

function changeMeetsLegalRqmts(){
    steps.addValStep3MeetsLegalRqmts(document.querySelector('.step.active'));
}

function changeMeetRequirements(){
    steps.addVelStep3MeetRequirements(document.querySelector('.step.active'));
}

function changeFinancingMeetsLegalRqmts(){
    steps.addValStep5Checkboxes(document.querySelector('.step.active'));
}

function changeConfirm(){
    steps.addValStep6(document.querySelector('.step.active'));
}

function clearValidationUI(root) {
    if (!root) return;

    const clearFieldErrorFn =
        typeof window !== 'undefined' && typeof window.clearFieldError === 'function'
            ? window.clearFieldError
            : null;

    root.querySelectorAll('.input-error').forEach((el) => {
        if (clearFieldErrorFn) {
            clearFieldErrorFn(el);
        } else {
            el.classList.remove('input-error');
        }
    });

    root.querySelectorAll('.input-error-text').forEach((el) => el.remove());
}

(function setupSearchableMultiSelects() {
    const selects = Array.from(
        document.querySelectorAll('select[data-search-multi="true"]')
    );
    if (!selects.length) return;

    function updateSubtitle(selectEl) {
        const subtitleValue = selectEl
            .closest('.full-width')
            ?.querySelector('.selected-values');
        if (!subtitleValue) return;

        const selectedLabels = Array.from(selectEl.selectedOptions)
            .map((option) => option.textContent.trim())
            .filter((text) => text.length > 0);

        subtitleValue.textContent = selectedLabels.length
            ? selectedLabels.join(', ')
            : 'Не выбрано';
    }

    function closeDropdown(dropdown) {
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    function buildComponent(selectEl) {
        const wrapper = document.createElement('div');
        wrapper.className = 'multi-select-wrap';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'multi-select-input';
        input.placeholder = 'Начните вводить для поиска';
        input.autocomplete = 'off';

        const dropdown = document.createElement('div');
        dropdown.className = 'multi-select-dropdown';
        dropdown.style.display = 'none';

        const options = Array.from(selectEl.options).filter(
            (option) => option.value && !option.disabled
        );

        function render(query) {
            dropdown.innerHTML = '';
            const normalized = query.trim().toLowerCase();
            const visibleOptions = options.filter((option) =>
                option.textContent.toLowerCase().includes(normalized)
            );

            if (!visibleOptions.length) {
                const empty = document.createElement('div');
                empty.className = 'multi-select-empty';
                empty.textContent = 'Ничего не найдено';
                dropdown.appendChild(empty);
                return;
            }

            visibleOptions.forEach((option) => {
                const item = document.createElement('label');
                item.className = 'multi-select-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = option.selected;

                const text = document.createElement('span');
                text.textContent = option.textContent.trim();

                checkbox.addEventListener('change', () => {
                    option.selected = checkbox.checked;
                    updateSubtitle(selectEl);
                    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                });

                item.appendChild(checkbox);
                item.appendChild(text);
                dropdown.appendChild(item);
            });
        }

        input.addEventListener('focus', () => {
            render(input.value);
            dropdown.style.display = 'block';
        });

        input.addEventListener('input', () => {
            render(input.value);
            dropdown.style.display = 'block';
        });

        selectEl.addEventListener('change', () => {
            updateSubtitle(selectEl);
            render(input.value);
        });

        document.addEventListener('click', (event) => {
            if (!wrapper.contains(event.target)) {
                closeDropdown(dropdown);
            }
        });

        selectEl.style.display = 'none';
        selectEl.parentNode.insertBefore(wrapper, selectEl);
        wrapper.appendChild(input);
        wrapper.appendChild(dropdown);

        render('');
        updateSubtitle(selectEl);
    }

    selects.forEach((selectEl) => buildComponent(selectEl));
})();
