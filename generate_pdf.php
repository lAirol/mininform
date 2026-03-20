<?php
declare(strict_types=1);

require __DIR__ . '/tfpdf/tfpdf.php';

$raw = file_get_contents('php://input');
$rawTrim = is_string($raw) ? trim($raw) : '';
if ($rawTrim === '') {
    // Удобно для локальной проверки без HTTP
    $raw = file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . 'data.js');
}
$data = json_decode($raw ?? '', true);
if (!is_array($data)) {
    http_response_code(400);
    echo 'Invalid JSON';
    exit;
}

class PDF extends tFPDF {
    function CheckPageBreak(float $h): void {
        if ($this->GetY() + $h > $this->PageBreakTrigger) {
            $this->AddPage($this->CurOrientation);
        }
    }

    // Оценка количества строк, которые влезут в ширину при MultiCell
    function NbLines(float $w, string $txt): int {
        $txt = (string)$txt;
        $cw = &$this->CurrentFont['cw'];

        if ($w == 0) {
            $w = $this->w - $this->rMargin - $this->x;
        }
        $wmax = ($w - 2 * $this->cMargin) * 1000 / $this->FontSize;

        $s = str_replace("\r", '', $txt);
        $nb = strlen($s);
        if ($nb > 0 && $s[$nb - 1] === "\n") {
            $nb--;
        }

        $sep = -1;
        $i = 0;
        $j = 0;
        $l = 0;
        $nl = 1;

        while ($i < $nb) {
            $c = $s[$i];

            if ($c === "\n") {
                $i++;
                $sep = -1;
                $j = $i;
                $l = 0;
                $nl++;
                continue;
            }

            if ($c === ' ') {
                $sep = $i;
            }

            $charCode = ord($c);
            $charWidth = isset($cw[$charCode]) ? (float)$cw[$charCode] : 500;
            $l += $charWidth;

            if ($l > $wmax) {
                if ($sep === -1) {
                    if ($i === $j) {
                        $i++;
                    }
                } else {
                    $i = $sep + 1;
                }
                $sep = -1;
                $j = $i;
                $l = 0;
                $nl++;
            } else {
                $i++;
            }
        }

        return $nl;
    }

    function WriteWrapped(float $h, string $txt, float $w = 0, string $align = 'L', int $border = 0): void {
        if ($txt === '') {
            $this->Ln($h);
            return;
        }

        $w = $w > 0 ? $w : ($this->w - $this->lMargin - $this->rMargin);
        $nb = $this->NbLines($w, $txt);
        $this->CheckPageBreak($nb * $h);
        $this->MultiCell($w, $h, $txt, $border, $align);
    }

    /**
     * Табличная строка в формате "поле / значение" с обводкой и переносом.
     */
    function Row2Col(string $label, string $value, float $labelWidth = 90.0, float $hLine = 5.0): void {
        $contentW = $this->w - $this->lMargin - $this->rMargin;
        $w1 = $labelWidth;
        $w2 = max(20.0, $contentW - $w1);

        $label = (string)$label;
        $value = (string)$value;

        $nb1 = $this->NbLines($w1, $label);
        $nb2 = $this->NbLines($w2, $value);
        $nb = max($nb1, $nb2, 1);
        // Делаем небольшой запас высоты, чтобы MultiCell при переносе
        // из-за несовпадения оценки ширины не выходил за рамку.
        $h = ($nb + 1) * $hLine;

        $this->CheckPageBreak($h);

        $x = $this->GetX();
        $y = $this->GetY();

        $this->Rect($x, $y, $w1, $h);
        $this->Rect($x + $w1, $y, $w2, $h);

        $this->SetXY($x, $y);
        $this->MultiCell($w1, $hLine, $label, 0, 'L');

        $this->SetXY($x + $w1, $y);
        $this->MultiCell($w2, $hLine, $value, 0, 'L');

        $this->SetXY($x, $y + $h);
    }

    /**
     * Простая таблица с N колонками и обводкой каждой ячейки.
     * $rowHeightBase — базовая высота строки на 1 "виртуальную" строку (перенос).
     */
    function DrawTable(array $rows, array $widths, float $rowHeightBase = 4.5): void {
        $this->SetFont('DejaVu', '', 10);
        foreach ($rows as $row) {
            $nb = 1;
            $rowCount = count($row);
            for ($i = 0; $i < $rowCount; $i++) {
                $cellValue = is_scalar($row[$i]) ? (string)$row[$i] : '';
                $nb = max($nb, $this->NbLines((float)$widths[$i], $cellValue));
            }

            $h = ($nb + 1) * $rowHeightBase;
            $this->CheckPageBreak($h);

            $x = $this->GetX();
            $y = $this->GetY();

            $currX = $x;
            for ($i = 0; $i < $rowCount; $i++) {
                $w = (float)$widths[$i];
                $this->Rect($currX, $y, $w, $h);
                $this->SetXY($currX, $y);
                $cellValue = is_scalar($row[$i]) ? (string)$row[$i] : '';
                $this->MultiCell($w, $rowHeightBase, $cellValue, 0, 'L');
                $currX += $w;
                $this->SetXY($currX, $y);
            }

            $this->SetXY($x, $y + $h);
        }
    }
}

function yn(mixed $v): string {
    return $v ? 'Да' : 'Нет';
}

function s(mixed $v, string $default = '-'): string {
    if ($v === null) return $default;
    if (is_string($v)) {
        $t = trim($v);
        return $t !== '' ? $t : $default;
    }
    if (is_bool($v)) return $v ? 'Да' : 'Нет';
    if (is_numeric($v)) return (string)$v;
    return $default;
}

function ind(int $level): string {
    return str_repeat('  ', max(0, $level));
}

function isJurByTypeFace(array $x): bool {
    return ($x['typeFace'] ?? '') === 'jurFace';
}

function isFizByTypeFace(array $x): bool {
    return ($x['typeFace'] ?? '') === 'fizFace';
}

/**
 * Вложенные учредители юридических лиц (jurFace) и физлиц (fizFace) в виде таблиц.
 * В образцах вложенные юр. лица обычно выводятся списком: ФИО/название / страна / доля.
 */
function flattenByType(array $items, string $prefix, string $childrenKey, bool $wantJur): array {
    $rows = [];

    foreach ($items as $i => $it) {
        $idx = $i + 1;
        $p = $prefix . $idx . '.';

        $typeFace = (string)($it['typeFace'] ?? '');
        $isJur = $typeFace === 'jurFace';
        $isFiz = $typeFace === 'fizFace';

        if ($wantJur && $isJur) {
            $name = s($it['name'] ?? $it['fullName'] ?? '', '');
            $country = s($it['country'] ?? $it['citizenship'] ?? '', '');
            $percent = (isset($it['capitalPercent']) && $it['capitalPercent'] !== '') ? ((string)$it['capitalPercent'] . '%') : '-';
            $rows[] = [rtrim($p, '.').' '.$name, $country, $percent];
        }

        if (!$wantJur && $isFiz) {
            $name = s($it['name'] ?? $it['fullName'] ?? '', '');
            $country = s($it['country'] ?? $it['citizenship'] ?? '', '');
            $percent = (isset($it['capitalPercent']) && $it['capitalPercent'] !== '') ? ((string)$it['capitalPercent'] . '%') : '-';
            $rows[] = [rtrim($p, '.').' '.$name, $country, $percent];
        }

        // Рекурсивно продолжаем искать вложенных по тому же childrenKey (founders/owners)
        if (!$isFiz) {
            $nested = $it[$childrenKey] ?? [];
            if (is_array($nested) && count($nested) > 0) {
                $rows = array_merge($rows, flattenByType($nested, $p, $childrenKey, $wantJur));
            }
        }
    }

    return $rows;
}

function drawNestedTables(PDF $pdf, array $nestedItems, string $prefix, int $level, string $childrenKey): void {
    if (!$nestedItems) return;

    $jurRows = flattenByType($nestedItems, $prefix, $childrenKey, true);
    $fizRows = flattenByType($nestedItems, $prefix, $childrenKey, false);

    if ($jurRows) {
        $pdf->SetFont('DejaVu', '', 10);
        $pdf->WriteWrapped(5, ind($level) . 'Учредители юридических лиц:');
        // Ширины под A4: можно подгонять, но сначала фиксируем как в примерах примерно
        $pdf->DrawTable($jurRows, [85, 55, 30], 4.2);
        $pdf->Ln(1);
    }

    if ($fizRows) {
        $pdf->SetFont('DejaVu', '', 10);
        $pdf->WriteWrapped(5, ind($level) . 'Фамилия, имя, отчество гражданина (граждан):');
        $pdf->DrawTable($fizRows, [85, 55, 30], 4.2);
        $pdf->Ln(1);
    }
}

/**
 * Рекурсивный вывод учредителей (founders[]).
 * Для юр. лиц вложенные учредители лежат в key='founders'.
 */
function renderFounders(PDF $pdf, array $items, string $prefix, int $level, string $childrenKey = 'founders'): void {
    foreach ($items as $i => $f) {
        $idx = $i + 1;
        $p = $prefix . $idx . '.';

        $typeFace = (string)($f['typeFace'] ?? '');
        $isJur = $typeFace === 'jurFace' || array_key_exists('capitalPercent', $f) || array_key_exists('isState', $f);

        if ($isJur) {
            $isState = !empty($f['isState']);
            $pdf->SetFont('DejaVu', '', 10);
            $pdf->Row2Col(ind($level) . $p . 'Государственный орган (организация)', yn($isState));
            $pdf->Row2Col(ind($level) . $p . 'Полное наименование (юр. лицо)', s($f['name'] ?? $f['fullName'] ?? ''));
            $pdf->Row2Col(ind($level) . $p . 'Резидент какой страны', s($f['country'] ?? $f['citizenship'] ?? ''));

            $capital = $f['capitalPercent'] ?? '';
            $pdf->Row2Col(
                ind($level) . $p . 'Доля иностранного участия в уставном фонде',
                $capital !== '' ? $capital . '%' : '-'
            );

            $pdf->Row2Col(ind($level) . $p . 'Адрес', s($f['address'] ?? ''));

            $phoneCode = s($f['phoneCode'] ?? '', '');
            $phone = s($f['phone'] ?? '', '');
            $fax = s($f['fax'] ?? '', '');
            $email = s($f['email'] ?? '', '');
            $contacts = 'код ' . ($phoneCode !== '' ? $phoneCode : '-') .
                ', телефон ' . ($phone !== '' ? $phone : '-') .
                ', факс ' . ($fax !== '' ? $fax : '-') .
                ', e-mail ' . ($email !== '' ? $email : '-');
            $pdf->Row2Col(ind($level) . $p . 'Контакты', $contacts);

            if (!$isState) {
                $nested = $f[$childrenKey] ?? [];
                if (is_array($nested) && count($nested) > 0) {
                    drawNestedTables($pdf, $nested, $p, $level + 1, $childrenKey);
                }
            }
        } else {
            $pdf->SetFont('DejaVu', '', 10);
            $pdf->Row2Col(ind($level) . $p . 'ФИО', s($f['fullName'] ?? $f['name'] ?? ''));
            $pdf->Row2Col(ind($level) . $p . 'Гражданство', s($f['citizenship'] ?? $f['country'] ?? ''));

            $pdf->Row2Col(ind($level) . $p . 'Адрес', s($f['address'] ?? ''));

            $phoneCode = s($f['phoneCode'] ?? '', '');
            $phone = s($f['phone'] ?? '', '');
            $email = s($f['email'] ?? '', '');
            $contacts = 'код ' . ($phoneCode !== '' ? $phoneCode : '-') .
                ', телефон ' . ($phone !== '' ? $phone : '-') .
                ', e-mail ' . ($email !== '' ? $email : '-');
            $pdf->Row2Col(ind($level) . $p . 'Контакты', $contacts);

            $pdf->Row2Col(ind($level) . $p . 'Отбываю наказание по приговору суда', yn(!empty($f['isServingSentence'])));
            $pdf->Row2Col(ind($level) . $p . 'Признан решением суда недееспособным', yn(!empty($f['isIncapacitated'])));
            $pdf->Row2Col(ind($level) . $p . 'Лишен в установленном порядке права заниматься деятельностью', yn(!empty($f['isDeprivedOfMediaRights'])));
            $pdf->Row2Col(ind($level) . $p . 'На момент гос. регистрации не прошло 3 лет со дня решения суда', yn(!empty($f['isMediaTerminated'])));
        }
    }
}

/**
 * Рекурсивный вывод собственников редакции (office.owners[]).
 * Для юр. лиц вложенные собственники лежат в key='owners'.
 */
function renderOwners(PDF $pdf, array $items, string $prefix, int $level, string $childrenKey = 'owners'): void {
    foreach ($items as $i => $o) {
        $idx = $i + 1;
        $p = $prefix . $idx . '.';

        $typeFace = (string)($o['typeFace'] ?? '');
        $isJur = $typeFace === 'jurFace' || array_key_exists('isState', $o);

        if ($isJur) {
            $isState = !empty($o['isState']);
            $pdf->Row2Col(ind($level) . $p . 'Государственный орган (организация)', yn($isState));
            $pdf->Row2Col(ind($level) . $p . 'Наименование (юр. лицо)', s($o['name'] ?? ''));
            $pdf->Row2Col(ind($level) . $p . 'Резидент какой страны', s($o['country'] ?? ''));
            $capital = $o['capitalPercent'] ?? '';
            $pdf->Row2Col(ind($level) . $p . 'Доля в уставном фонде', $capital !== '' ? $capital . '%' : '-');

            if (!$isState) {
                $nested = $o[$childrenKey] ?? [];
                if (is_array($nested) && count($nested) > 0) {
                    drawNestedTables($pdf, $nested, $p, $level + 1, $childrenKey);
                }
            }
        } else {
            $pdf->Row2Col(ind($level) . $p . 'Физ. лицо', s($o['name'] ?? ''));
            $pdf->Row2Col(ind($level) . $p . 'Резидент какой страны', s($o['country'] ?? ''));
            $capital = $o['capitalPercent'] ?? '';
            $pdf->Row2Col(ind($level) . $p . 'Доля в уставном фонде', $capital !== '' ? $capital . '%' : '-');
        }
    }
}

$pdf = new PDF();
$pdf->AddPage();

// Шрифт для кириллицы
$pdf->AddFont('DejaVu', '', 'DejaVuSansCondensed.ttf', true);
$pdf->SetFont('DejaVu', '', 11);
$pdf->SetMargins(10, 10, 10);
$pdf->SetAutoPageBreak(true, 14);

// Заголовок
$pdf->WriteWrapped(6, 'Министерство информации Республики Беларусь', 0, 'C');
$pdf->Ln(1);
$pdf->SetFont('DejaVu', '', 10);
$pdf->WriteWrapped(6, 'ЗАЯВЛЕНИЕ о государственной регистрации (перерегистрации) средства массовой информации', 0, 'C');
$pdf->Ln(2);
$pdf->WriteWrapped(5, 'Прошу (просим) произвести государственную регистрацию (перерегистрацию) средства массовой информации:');
$pdf->Ln(1);
$pdf->WriteWrapped(5, '— ' . s($data['mainInfo']['name'] ?? '', '—'));
$pdf->Ln(2);

// 1. Учредитель
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '1. Учредитель (учредители) средства массовой информации');
$pdf->Ln(1);
$founders = is_array($data['founders'] ?? null) ? $data['founders'] : [];
if (!$founders) {
    $pdf->WriteWrapped(5, '-');
} else {
    renderFounders($pdf, $founders, '1.', 0, 'founders');
}
$pdf->Ln(2);

// 1-1. Владелец сетевого издания (может отсутствовать в текущем data.js)
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '1-1. Владелец сетевого издания');
$pdf->SetFont('DejaVu', '', 10);
$domainName = $data['domainOwner']['domainName'] ?? '';
$pdf->Row2Col('1-1.1. Доменное имя сетевого издания', s($domainName, '-'));
$pdf->Ln(2);

// 2-3
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '2. Название средства массовой информации');
$pdf->SetFont('DejaVu', '', 10);
$pdf->Row2Col('2. Название средства массовой информации', s($data['mainInfo']['name'] ?? '', '-'));
$pdf->Ln(1);
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '3. Вид средства массовой информации');
$pdf->SetFont('DejaVu', '', 10);
$kindLine = s($data['mainInfo']['typeSmi'] ?? '', '-') . ' (' . s($data['mainInfo']['kindSmi'] ?? '', '') . ($data['mainInfo']['kindSmiOther'] ?? '' ? ', ' . s($data['mainInfo']['kindSmiOther'] ?? '') : '') . ')';
$pdf->Row2Col('3. Вид средства массовой информации', trim($kindLine) !== '' ? $kindLine : '-');
$pdf->Ln(2);

// 4. Редакция (юр. лицо)
$office = is_array($data['office'] ?? null) ? $data['office'] : [];
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '4. Юридическое лицо, на которое возложены функции редакции средства массовой информации');
$pdf->SetFont('DejaVu', '', 10);
$pdf->Row2Col('4.1. Полное наименование юридического лица', s($office['fullName'] ?? '', '-'));
$pdf->Row2Col('4.1.1. Резидент какой страны', s($office['country'] ?? '', '-'));
$pdf->Row2Col('4.1.2. Адрес юридического лица', s($office['address'] ?? '', '-'));

$phoneCode = s($office['phoneCode'] ?? '', '');
$phone = s($office['phone'] ?? '', '');
$fax = s($office['fax'] ?? '', '');
$email = s($office['email'] ?? '', '');
$contacts = 'код ' . ($phoneCode !== '' ? $phoneCode : '-') .
    ', телефон ' . ($phone !== '' ? $phone : '-') .
    ', факс ' . ($fax !== '' ? $fax : '-') .
    ', e-mail ' . ($email !== '' ? $email : '-');
$pdf->Row2Col('4.1.3. Контактный телефон / факс / e-mail', $contacts);
$pdf->Row2Col('4.1.4. Адрес веб-сайта', s($office['www'] ?? '', '-'));
$pdf->Row2Col('4.1.5. Тип помещения', s($office['room'] ?? '', '-'));
$pdf->Ln(1);

// 4.2. Собственники имущества редакции (office.owners[])
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '4.2. Сведения о собственниках имущества (учредителях, участниках)');
$pdf->SetFont('DejaVu', '', 10);
$owners = is_array($office['owners'] ?? null) ? $office['owners'] : [];
if (!$owners) {
    $pdf->WriteWrapped(5, '-');
} else {
    renderOwners($pdf, $owners, '4.2.', 0, 'owners');
}
$pdf->Ln(2);

// 4.3. Главный редактор
$chief = is_array($office['chiefEditor'] ?? null) ? $office['chiefEditor'] : [];
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '4.3. Главный редактор (редактор)');
$pdf->SetFont('DejaVu', '', 10);
$pdf->Row2Col('4.3.1. Данные акта, на основании которого принято решение о назначении', s($chief['actAssignment'] ?? '', '-'));
$pdf->Row2Col('4.3.2. Соответствует квалификационным требованиям', yn(!empty($chief['meetRequirements'])));
$pdf->Row2Col('4.3.3. Учебное заведение, период обучения', s($chief['institution'] ?? '', '-'));
$pdf->Row2Col('4.3.4. Сведения о работе на руководящих должностях', s($chief['formerJobInfo'] ?? '', '-'));
$pdf->Row2Col('4.3.5. Фамилия, имя, отчество главного редактора (редактора)', s($chief['name'] ?? '', '-'));
$pdf->Row2Col('4.3.5-1. Гражданство', s($chief['country'] ?? '', '-'));
$pdf->Ln(2);

// 5. Специализация
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '5. Специализация(тематика) средства массовой информации');
$pdf->SetFont('DejaVu', '', 10);
$spec = implode(', ', $data['mainInfo']['specialization'] ?? []);
$specOther = s($data['mainInfo']['specializationOther'] ?? '', '');
$specLine = trim($spec . ($specOther !== '' ? ' ; ' . $specOther : ''));
$pdf->Row2Col('5.1. Специализация и тематика', $specLine !== '' ? $specLine : '-');
$pdf->Ln(2);

// 6-8
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '6. Периодичность и распространение');
$pdf->SetFont('DejaVu', '', 10);
$pdf->Row2Col('6.1. Периодичность', s($data['mainInfo']['periodicity'] ?? '', '-'));
$pdf->Row2Col('6.2. Максимальный объем вещания', s($data['mainInfo']['volumeVoice'] ?? '', '-'));
$pdf->Row2Col('6.3. Объем материалов белорусского производства, %', ($data['mainInfo']['bynVolume'] ?? '' !== '' ? s($data['mainInfo']['bynVolume']) . '%' : '-'));
$langLine = implode(', ', $data['mainInfo']['language'] ?? []);
$langOtherText = s($data['mainInfo']['languageOtherText'] ?? '', '');
$langOther = s($data['mainInfo']['languageOther'] ?? '', '');
$pdf->Row2Col(
    '7. Язык средства массовой информации',
    trim($langLine . ($langOtherText !== '' ? ' ' . $langOtherText . ' ' . $langOther : '')) !== ''
        ? trim($langLine . ($langOtherText !== '' ? ' ' . $langOtherText . ' ' . $langOther : ''))
        : '-'
);
$pdf->Row2Col(
    '8. Территория распространения',
    s($data['mainInfo']['distributionTerritory'] ?? '', '-') . (s($data['mainInfo']['distributionTerritoryDetail'] ?? '', '') !== '-' ? ' ' . s($data['mainInfo']['distributionTerritoryDetail'] ?? '', '') : '')
);
$pdf->Ln(2);

// 9. Финансирование
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '9. Финансирование средства массовой информации соответствует требованиям законодательства');
$pdf->SetFont('DejaVu', '', 10);
$pdf->Row2Col('9.0. Финансирование соответствует законодательству', yn(!empty($data['financingMeetsLegalRqmts'])));

$sponsors = is_array($data['sponsors'] ?? null) ? $data['sponsors'] : [];
$jurSponsors = array_values(array_filter($sponsors, fn($s) => ($s['typeFace'] ?? '') === 'jurFace'));
$fizSponsors = array_values(array_filter($sponsors, fn($s) => ($s['typeFace'] ?? '') === 'fizFace'));

$pdf->Ln(1);
$pdf->WriteWrapped(5, '9.1. Источники финансирования:');
$pdf->Ln(1);

if ($jurSponsors) {
    $pdf->WriteWrapped(5, ind(1) . '9.1.1. Поступающие от юридических лиц:');
    foreach ($jurSponsors as $i => $sp) {
        $label = ind(2) . ($i + 1) . '. ';
        $value = s($sp['name'] ?? '', '-') . ', ' . s($sp['country'] ?? '', '-') .
            ', доля ' . s($sp['shareInCapital'] ?? '', '-') . '%; форма участия: ' . s($sp['participationForm'] ?? '', '-');
        $pdf->Row2Col($label . 'Юридическое лицо', $value);
    }
}
if ($fizSponsors) {
    $pdf->WriteWrapped(5, ind(1) . '9.1.2. Поступающие от физических лиц:');
    foreach ($fizSponsors as $i => $sp) {
        $label = ind(2) . ($i + 1) . '. ';
        $value = s($sp['name'] ?? '', '-') . ', ' . s($sp['country'] ?? '', '-') .
            ', доля ' . s($sp['shareInCapital'] ?? '', '-') . '%; форма участия: ' . s($sp['participationForm'] ?? '', '-');
        $pdf->Row2Col($label . 'Физическое лицо', $value);
    }
}
if (!$jurSponsors && !$fizSponsors) {
    $pdf->WriteWrapped(5, ind(1) . '-');
}
$pdf->Ln(2);

// 10. Тираж (если требуется)
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '10. Предполагаемый тираж средства массовой информации (для печатного средства массовой информации)');
$pdf->SetFont('DejaVu', '', 10);
$pdf->Row2Col('10. Предполагаемый тираж', s($data['mainInfo']['circulation'] ?? '', '-'));
$pdf->Ln(2);

// 11. Прочие сведения
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '11. Сведения о том, является ли учредитель/главный редактор/журналист других средств массовой информации...');
$pdf->SetFont('DejaVu', '', 10);
$information = s($data['information'] ?? '', '');
$confirm = array_key_exists('confirm', $data) ? $data['confirm'] : null;
$pdf->Row2Col('11.1. Текст', $information !== '' ? $information : '-');
if ($confirm !== null) {
    $pdf->Row2Col('11.2. Ответ', yn((bool)$confirm));
}

$outMode = (PHP_SAPI === 'cli') ? 'F' : 'I';
$outFile = (PHP_SAPI === 'cli') ? (__DIR__ . DIRECTORY_SEPARATOR . 'zayavlenie_smi_test.pdf') : 'zayavlenie_smi.pdf';
$pdf->Output($outMode, $outFile);
