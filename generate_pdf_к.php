<?php
declare(strict_types=1);

require __DIR__ . '/tfpdf/tfpdf.php';

$raw = file_get_contents('php://input');
$rawTrim = is_string($raw) ? trim($raw) : '';
if ($rawTrim === '') {
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

    function NbLines(float $w, string $txt): int {
        $txt = (string)$txt;
        $cw = &$this->CurrentFont['cw'];
        if ($w == 0) $w = $this->w - $this->rMargin - $this->x;
        $wmax = ($w - 2 * $this->cMargin) * 1000 / $this->FontSize;
        $s = str_replace("\r", '', $txt);
        $nb = strlen($s);
        if ($nb > 0 && $s[$nb-1] === "\n") $nb--;
        $sep = -1; $i = $j = $l = 0; $nl = 1;
        while ($i < $nb) {
            $c = $s[$i];
            if ($c === "\n") { $i++; $sep = -1; $j = $i; $l = 0; $nl++; continue; }
            if ($c === ' ') $sep = $i;
            $charWidth = isset($cw[ord($c)]) ? (float)$cw[ord($c)] : 500;
            $l += $charWidth;
            if ($l > $wmax) {
                if ($sep === -1) { if ($i === $j) $i++; } else $i = $sep + 1;
                $sep = -1; $j = $i; $l = 0; $nl++;
            } else $i++;
        }
        return $nl;
    }

    function WriteWrapped(float $h, string $txt, float $w = 0, string $align = 'L'): void {
        if ($txt === '') {
            $this->Ln($h);
            return;
        }
        $w = $w > 0 ? $w : ($this->w - $this->lMargin - $this->rMargin);
        $nb = $this->NbLines($w, $txt);
        $this->CheckPageBreak($nb * $h);
        $this->MultiCell($w, $h, $txt, 0, $align);
    }

    function Row2Col(string $label, string $value, float $labelWidth = 90.0): void {
        $contentW = $this->w - $this->lMargin - $this->rMargin;
        $w2 = max(20.0, $contentW - $labelWidth);
        $nb = max($this->NbLines($labelWidth, $label), $this->NbLines($w2, $value), 1);
        $h = ($nb + 1) * 5.0;
        $this->CheckPageBreak($h);
        $x = $this->GetX(); $y = $this->GetY();
        $this->Rect($x, $y, $labelWidth, $h);
        $this->Rect($x + $labelWidth, $y, $w2, $h);
        $this->SetXY($x, $y); $this->MultiCell($labelWidth, 5, $label, 0, 'L');
        $this->SetXY($x + $labelWidth, $y); $this->MultiCell($w2, 5, $value, 0, 'L');
        $this->SetXY($x, $y + $h);
    }

    function DrawTable(array $rows, array $widths, float $rowHeightBase = 4.5): void {
        $this->SetFont('DejaVu', '', 10);
        foreach ($rows as $row) {
            $nb = 1;
            for ($i = 0; $i < count($row); $i++) {
                $nb = max($nb, $this->NbLines((float)$widths[$i], (string)$row[$i]));
            }
            $h = ($nb + 1) * $rowHeightBase;
            $this->CheckPageBreak($h);
            $x = $this->GetX(); $y = $this->GetY(); $currX = $x;
            for ($i = 0; $i < count($row); $i++) {
                $w = (float)$widths[$i];
                $this->Rect($currX, $y, $w, $h);
                $this->SetXY($currX, $y);
                $this->MultiCell($w, $rowHeightBase, (string)$row[$i], 0, 'L');
                $currX += $w;
            }
            $this->SetXY($x, $y + $h);
        }
    }
}

function s(mixed $v, string $default = '-'): string {
    if ($v === null || $v === '') return $default;
    return (string)$v;
}
function yn(bool $v): string { return $v ? 'Да' : 'Нет'; }

function flattenNested(array $items, string $prefix, string $childrenKey = 'founders'): array {
    $rows = [];
    foreach ($items as $i => $it) {
        $idx = $i + 1;
        $p = $prefix . $idx . '. ';
        $name = s($it['name'] ?? $it['fullName'] ?? '');
        $country = s($it['country'] ?? $it['citizenship'] ?? '');
        $percent = isset($it['capitalPercent']) && $it['capitalPercent'] !== '' ? $it['capitalPercent'] . '%' : '-';
        $rows[] = [$p . $name, $country, $percent];

        if (!empty($it[$childrenKey]) && is_array($it[$childrenKey])) {
            $rows = array_merge($rows, flattenNested($it[$childrenKey], $p, $childrenKey));
        }
    }
    return $rows;
}

// ====================== ГЕНЕРАЦИЯ ======================
$pdf = new PDF();
$pdf->AddPage();
$pdf->AddFont('DejaVu', '', 'DejaVuSansCondensed.ttf', true);
$pdf->SetFont('DejaVu', '', 11);
$pdf->SetMargins(10, 10, 10);
$pdf->SetAutoPageBreak(true, 14);

$pdf->WriteWrapped(6, 'Министерство информации Республики Беларусь', 0, 'C');
$pdf->Ln(1);
$pdf->SetFont('DejaVu', '', 10);
$pdf->WriteWrapped(6, 'ЗАЯВЛЕНИЕ о государственной регистрации (перерегистрации) средства массовой информации', 0, 'C');
$pdf->Ln(2);
$pdf->WriteWrapped(5, 'Прошу (просим) произвести государственную регистрацию (перерегистрацию) средства массовой информации:');
$pdf->Ln(1);
$pdf->WriteWrapped(5, 'Электронное_' . s($data['mainInfo']['name'] ?? 'СМИ'));
$pdf->Ln(3);

// 1. УЧРЕДИТЕЛЬ (учредители)
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '1. Учредитель (учредители) средства массовой информации');
$pdf->Ln(1);

$founders = $data['founders'] ?? [];
foreach ($founders as $i => $f) {
    $p = '1.' . ($i + 1) . '.';
    $isState = !empty($f['isState']);

    $pdf->Row2Col($p . ' Государственный орган (организация)', yn($isState));
    $pdf->Row2Col($p . ' Полное наименование юридического лица', s($f['name'] ?? $f['fullName']));
    $pdf->Row2Col($p . ' Резидент какой страны', s($f['country']));
    $pdf->Row2Col($p . ' Доля иностранного участия в уставном фонде',
        (isset($f['capitalPercent']) && $f['capitalPercent'] !== '') ? $f['capitalPercent'] . '%' : '-');
}

// Таблица «Учредители юридических лиц» (как в твоих сканах)
$pdf->Ln(3);
$pdf->SetFont('DejaVu', '', 10);
$pdf->WriteWrapped(5, 'Учредители юридических лиц');

$founderRows = flattenNested($founders, '1.', 'founders'); // используй функцию ниже
$pdf->DrawTable($founderRows, [85, 55, 30], 4.2);

$pdf->Ln(5);

// 2. НАЗВАНИЕ
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '2. Название средства массовой информации');
$pdf->SetFont('DejaVu', '', 10);
$pdf->Row2Col('2. Название средства массовой информации', s($data['mainInfo']['name'] ?? ''));

$pdf->Ln(3);

// 3. ВИД
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '3. Вид средства массовой информации');
$pdf->SetFont('DejaVu', '', 10);
$kind = s($data['mainInfo']['typeSmi'] ?? '') .
    (isset($data['mainInfo']['kindSmi']) ? ' (' . s($data['mainInfo']['kindSmi']) . ')' : '');
$pdf->Row2Col('3. Вид средства массовой информации', $kind);

$pdf->Ln(5);

// 4. ЮРИДИЧЕСКОЕ ЛИЦО РЕДАКЦИИ
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '4. Юридическое лицо, на которое возложены функции редакции средства массовой информации');
$pdf->SetFont('DejaVu', '', 10);

$office = $data['office'] ?? [];
$pdf->Row2Col('4.1. Полное наименование юридического лица', s($office['fullName']));
$pdf->Row2Col('4.1.1. Резидент какой страны', s($office['country']));
$pdf->Row2Col('4.1.2. Адрес', s($office['address']));
$pdf->Row2Col('4.1.3. Контактный телефон / факс / e-mail',
    'код ' . s($office['phoneCode']) . ', телефон ' . s($office['phone']) .
    ', факс ' . s($office['fax']) . ', e-mail ' . s($office['email']));
$pdf->Row2Col('4.1.4. Адрес веб-сайта', s($office['www']));
$pdf->Row2Col('4.1.5. Помещение', s($office['room'] ?? 'Нежилом помещении'));

// 4.2. СОБСТВЕННИКИ (сначала Да/Нет, потом таблица)
$pdf->Ln(3);
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '4.2. Сведения о собственниках имущества (учредителях, участниках)');
$pdf->SetFont('DejaVu', '', 10);

$owners = $office['owners'] ?? [];
// Пронумерованные "Государственный орган (организация)"
foreach ($owners as $i => $o) {
    $pdf->Row2Col(($i + 1) . '.', yn(!empty($o['isState'])));
}

// Большая таблица собственников (как в сканах)
$pdf->Ln(2);
$ownerRows = flattenNested($owners, '4.2.', 'owners');
$pdf->DrawTable($ownerRows, [85, 55, 30], 4.2);

$pdf->Ln(3);

// 4.3. ГЛАВНЫЙ РЕДАКТОР
$chief = $office['chiefEditor'] ?? [];
$pdf->SetFont('DejaVu', '', 11);
$pdf->WriteWrapped(6, '4.3. Фамилия, собственное имя, отчество главного редактора (редактора)');
$pdf->SetFont('DejaVu', '', 10);
$pdf->Row2Col('4.3.1. Данные акта', s($chief['actAssignment']));
$pdf->Row2Col('4.3.2. Соответствует квалификационным требованиям', yn(!empty($chief['meetRequirements'])));
$pdf->Row2Col('4.3.3. Учебное заведение', s($chief['institution']));
$pdf->Row2Col('4.3.4. Сведения о работе на руководящих должностях', s($chief['formerJobInfo']));
$pdf->Row2Col('4.3.5. Фамилия, имя, отчество', s($chief['name']));
$pdf->Row2Col('4.3.5-1. Гражданство', s($chief['country']));

$pdf->Ln(5);
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
$pdf->Row2Col('9.', yn(!empty($data['financingMeetsLegalRqmts'])));

$sponsors = $data['sponsors'] ?? [];
if ($sponsors) {
    $pdf->Ln(2);
    $pdf->WriteWrapped(5, '9.1.1. Поступающие от юридических лиц');
    $jurRows = [];
    foreach ($sponsors as $i => $sp) {
        if (($sp['typeFace'] ?? '') === 'jurFace') {
            $jurRows[] = [
                ($i + 1) . '. ' . s($sp['name']),
                s($sp['country']),
                s($sp['shareInCapital']) . '%',
                s($sp['participationForm'])
            ];
        }
    }
    $pdf->DrawTable($jurRows, [80, 50, 30, 60], 4.2);
}

// ==================== ВЫВОД ====================
$outMode = (PHP_SAPI === 'cli') ? 'F' : 'I';
$outFile = (PHP_SAPI === 'cli') ? __DIR__ . '/zayavlenie_smi.pdf' : 'zayavlenie_smi.pdf';
$pdf->Output($outMode, $outFile);