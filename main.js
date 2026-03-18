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

        clearFieldError(el);

        const isSelect = el instanceof HTMLSelectElement;
        const value = isSelect ? (el.value || '') : (el.value || '').trim();
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

        return allValid;
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
            v = v.replace(/[^0-9.,-]/g, '');
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
            const filtered = orig.replace(/[^0-9+()\-\s]/g, '');
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
            const filtered = orig.replace(/[^0-9]/g, '');
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
        nextBtn.textContent = current === steps.length - 1 ? 'Готово' : 'дальше';

        if (scroll) {
            steps[current].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        history.replaceState(null, '', `#step-${current + 1}`);
    }

    prevBtn.addEventListener('click', () => showStep(current - 1));
    nextBtn.addEventListener('click', () => {
        // Перед переходом дальше валидируем текущий шаг
        if (!validateStep(current)) {
            return;
        }

        if (current === steps.length - 1) {
            steps[current].scrollIntoView({ behavior: 'smooth', block: 'start' });
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

(function () {
    const btn = document.getElementById('submitJsonBtn');
    const container = document.querySelector('.container');
    if (!btn || !container) return;

    btn.addEventListener('click', async () => {
        // Перед сборкой JSON проверяем все шаги
        if (typeof window._validateAllSteps === 'function') {
            if (!window._validateAllSteps()) {
                return;
            }
        }

        const data = buildJsonFromForm(container);
        console.log('Собранный JSON:', data);

        try {
            const response = await fetch(send_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                alert('Ошибка при формировании PDF на сервере');
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'zayavlenie_smi.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Не удалось отправить данные на сервер или получить PDF');
        }
    });
})();



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


function changeFace(){
    let domainOwner = document.getElementById('domainOwner');
    let founder = document.getElementById('founder');
    if(domainOwner.hasAttribute("data-ignore-container")){
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