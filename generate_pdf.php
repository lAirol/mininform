<?php
declare(strict_types=1);

require __DIR__ . '/tfpdf/tfpdf.php';
require __DIR__ . '/validate_smi_json.php';

class PDF extends tFPDF
{
    public function CheckPageBreak(float $h): void
    {
        if ($this->GetY() + $h > $this->PageBreakTrigger) {
            $this->AddPage($this->CurOrientation);
        }
    }

    public function NbLinesUtf8(float $w, string $txt): int
    {
        $txt = str_replace(["\r\n", "\r"], "\n", (string)$txt);
        if ($txt === '') {
            return 1;
        }

        if ($w <= 0) {
            $w = $this->w - $this->rMargin - $this->x;
        }

        $maxWidth = max(1.0, $w - 2 * $this->cMargin);
        $paragraphs = explode("\n", $txt);
        $totalLines = 0;

        foreach ($paragraphs as $paragraph) {
            if ($paragraph === '') {
                $totalLines++;
                continue;
            }

            $line = '';
            $lineCount = 1;
            $tokens = preg_split('/(\s+)/u', $paragraph, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
            if (!is_array($tokens) || $tokens === []) {
                $tokens = [$paragraph];
            }

            foreach ($tokens as $token) {
                $candidate = $line . $token;
                if ($line === '' || $this->GetStringWidth($candidate) <= $maxWidth) {
                    $line = $candidate;
                    continue;
                }

                if (trim($line) !== '') {
                    $lineCount++;
                }
                $line = ltrim($token);

                if ($line !== '' && $this->GetStringWidth($line) > $maxWidth) {
                    $chars = preg_split('//u', $line, -1, PREG_SPLIT_NO_EMPTY);
                    $line = '';
                    foreach ($chars as $char) {
                        $candidateChar = $line . $char;
                        if ($line === '' || $this->GetStringWidth($candidateChar) <= $maxWidth) {
                            $line = $candidateChar;
                            continue;
                        }
                        $lineCount++;
                        $line = $char;
                    }
                }
            }

            $totalLines += max(1, $lineCount);
        }

        return max(1, $totalLines);
    }

    /**
     * @param array<int, array{w:float|string,text:string,align?:string,style?:string}> $cells
     */
    public function TableRow(array $cells, float $lineHeight = 4.2, string $defaultFont = 'DejaVu', float $fontSize = 9.4): void
    {
        $maxLines = 1;
        foreach ($cells as $cell) {
            $maxLines = max($maxLines, $this->NbLinesUtf8((float)$cell['w'], (string)($cell['text'] ?? '')));
        }

        $rowHeight = max(6.4, $maxLines * $lineHeight + 1.6);
        $this->CheckPageBreak($rowHeight);

        $x = $this->GetX();
        $y = $this->GetY();
        $currentX = $x;

        foreach ($cells as $cell) {
            $w = (float)$cell['w'];
            $text = (string)($cell['text'] ?? '');
            $align = (string)($cell['align'] ?? 'L');
            $style = (string)($cell['style'] ?? '');

            $this->Rect($currentX, $y, $w, $rowHeight);
            $this->SetXY($currentX, $y + 0.8);
            $this->SetFont($defaultFont, $style, $fontSize);
            $this->MultiCell($w, $lineHeight, $text, 0, $align);
            $currentX += $w;
            $this->SetXY($currentX, $y);
        }

        $this->SetXY($x, $y + $rowHeight);
    }
}

class SmiPdfGenerator
{
    private const PAGE_WIDTH = 190.0;
    private const LABEL_W = 127.0;
    private const VALUE_W = 63.0;
    private const YES_W = 31.5;
    private const NO_W = 31.5;
    private const SIDE_TITLE_W = 63.0;
    private const SIDE_COL1_W = 63.0;
    private const SIDE_COL2_W = 37.0;
    private const SIDE_COL3_W = 27.0;
    private const SMALL_COL_W = 63.3333;

    private $uploadsBasePath;
    private $currentBaseName = '';

    public function __construct(?string $uploadsBasePath = null)
    {
        $this->uploadsBasePath = $uploadsBasePath ?: 'uploads/files/form';
    }

    /**
     * @param string|array<mixed> $payload
     */
    public function generate($payload): string
    {
        $data = $this->normalizeData($payload);
        $validation = validateSmiJson($data);
        if (!$validation['ok']) {
            throw new InvalidArgumentException(implode('; ', $validation['errors']));
        }

        $this->currentBaseName = $this->buildDocumentBaseName($data);

        $pdf = new PDF('P', 'mm', 'A4');
        $pdf->SetMargins(10, 10, 10);
        $pdf->SetAutoPageBreak(true, 10);
        $pdf->AddFont('DejaVu', '', 'DejaVuSansCondensed.ttf', true);
        $pdf->AddFont('DejaVu', 'B', 'DejaVuSansCondensed-Bold.ttf', true);
        $pdf->AddPage();

        $this->renderHeader($pdf);
        $this->renderFoundersSection($pdf, $data);
        $this->renderNetworkOwnerSection($pdf, $data);
        $this->renderFoundersContactsAndIndividuals($pdf, $data);
        $this->renderMainInfoRows($pdf, $data);
        $this->renderOfficeSection($pdf, $data);
        $this->renderSpecializationAndDistribution($pdf, $data);
        $this->renderFinancingSection($pdf, $data);
        $this->renderTailSection($pdf, $data);

        return $this->saveResult($pdf, $data);
    }

    private function renderHeader(PDF $pdf): void
    {
        $pdf->SetFont('DejaVu', 'B', 13.2);
        $pdf->MultiCell(self::PAGE_WIDTH, 6.4, 'Министерство информации Республики Беларусь', 0, 'L');
        $pdf->Ln(1.2);

        $pdf->SetFont('DejaVu', 'B', 11.0);
        $pdf->MultiCell(
            self::PAGE_WIDTH,
            5.4,
            'ЗАЯВЛЕНИЕ о государственной регистрации (перерегистрации) средства массовой информации',
            0,
            'L'
        );
        $pdf->Ln(2.0);

        $pdf->SetFont('DejaVu', 'B', 10.4);
        $pdf->MultiCell(
            self::PAGE_WIDTH,
            5.2,
            'Прошу (просим) произвести государственную регистрацию (перерегистрацию) средства массовой информации:',
            0,
            'L'
        );
        $pdf->Ln(1.2);
        $pdf->SetFont('DejaVu', 'B', 10.6);
        $pdf->MultiCell(self::PAGE_WIDTH, 5.2, $this->currentBaseName, 0, 'L');
        $pdf->Ln(2.0);
    }

    /**
     * @param array<string,mixed> $data
     */
    private function renderFoundersSection(PDF $pdf, array $data): void
    {
        [$legalFounders, ] = $this->splitFounders($data);

        $this->fullWidthHeader($pdf, '1. Учредитель (учредители) средства массовой информации');
        $this->yesNoListRow($pdf, 'Государственный орган (организация)', $this->stateFlags($legalFounders));
        $this->pairRow($pdf, '1.1. Полное наименование юридического лица (юридических лиц)', $this->stackTopLevel($legalFounders, 'name'));
        $this->pairRow($pdf, '1.1.1. Резидент какой страны', $this->stackTopLevel($legalFounders, 'country'));
        $this->pairRow($pdf, '1.1.1-1. Доля иностранного участия в уставном фонде', $this->stackTopLevelPercent($legalFounders, 'capitalPercent'));

        $nestedRows = $this->flattenNestedRowsFromParents($legalFounders, 'founders');
        $this->sideTitleTable(
            $pdf,
            'Учредители юридических лиц',
            'ФИО (наименование юр. лица)',
            'Гражданство (резидент какой страны)',
            'Доля в уставном фонде %',
            $nestedRows
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    private function renderNetworkOwnerSection(PDF $pdf, array $data): void
    {
        $domainOwner = is_array($data['domainOwner'] ?? null) ? $data['domainOwner'] : [];
        $isLegal = $this->isLegalItem($domainOwner);
        $hasDomainOwner = $domainOwner !== [];

        $this->fullWidthHeader($pdf, '1-1. Владелец сетевого издания');

        $this->pairRow($pdf, '1-1.1. Полное наименование юридического лица', $hasDomainOwner && $isLegal ? $this->displayName($domainOwner) : '');
        $this->pairRow($pdf, '1-1.1.1. Резидент какой страны', $hasDomainOwner && $isLegal ? $this->value($domainOwner['country'] ?? '') : '');
        $this->pairRow($pdf, '1-1.1.2. Доля иностранного участия в уставном фонде', $hasDomainOwner && $isLegal ? $this->percent($domainOwner['capitalPercent'] ?? null) : '');
        $this->pairRow($pdf, '1-1.1.3. Адрес (почтовый индекс, область, район, город, населенный пункт, улица (проспект, переулок и т.д.), номер дома, корпус, квартира (офис)', $hasDomainOwner && $isLegal ? $this->value($domainOwner['address'] ?? '') : '');
        $this->contactBlock($pdf, '1-1.1.4. Контактный телефон', $hasDomainOwner && $isLegal ? [$domainOwner] : []);
        $this->emailRow($pdf, $hasDomainOwner && $isLegal ? [$domainOwner] : []);

        $this->pairRow($pdf, '1-1.2. Фамилия, собственное имя, отчество (если таковое имеется) гражданина', $hasDomainOwner && !$isLegal ? $this->displayName($domainOwner) : '');
        $this->pairRow($pdf, '1-1.2.1. Гражданство', $hasDomainOwner && !$isLegal ? $this->value($domainOwner['citizenship'] ?? $domainOwner['country'] ?? '') : '');
        $this->pairRow($pdf, '1-1.2.2. Адрес (почтовый индекс, область, район, город, населенный пункт, улица (проспект, переулок и т.д.), номер дома, корпус, квартира (офис)', $hasDomainOwner && !$isLegal ? $this->value($domainOwner['address'] ?? '') : '');
        $this->contactBlock($pdf, '1-1.2.3. Контактный телефон', $hasDomainOwner && !$isLegal ? [$domainOwner] : []);
        $this->emailRow($pdf, $hasDomainOwner && !$isLegal ? [$domainOwner] : []);

        $this->pairRow($pdf, '1-2. Доменное имя сетевого издания', $this->value($domainOwner['domainName'] ?? ''));
    }

    /**
     * @param array<string,mixed> $data
     */
    private function renderFoundersContactsAndIndividuals(PDF $pdf, array $data): void
    {
        [$legalFounders, $physicalFounders] = $this->splitFounders($data);

        $this->pairRow($pdf, '1.1.2. Адрес (почтовый индекс, область, район, город, населенный пункт, улица (проспект, переулок и т.д.), номер дома, корпус, квартира (офис)', $this->stackTopLevel($legalFounders, 'address'));
        $this->contactBlock($pdf, '1.1.3. Контактный телефон', $legalFounders);
        $this->emailRow($pdf, $legalFounders);

        $this->pairRow($pdf, '1.2. Фамилия, собственное имя, отчество(если таковое имеется) гражданина (граждан)', $this->stackTopLevel($physicalFounders, 'fullName'));
        $this->pairRow($pdf, '1.2.1. Гражданство', $this->stackTopLevel($physicalFounders, 'citizenship'));
        $this->yesNoListRow($pdf, '1.2.2. Отбываю наказание по приговору суда', $this->boolFlags($physicalFounders, 'isServingSentence'));
        $this->yesNoListRow($pdf, '1.2.3. Признан решением суда недееспособным', $this->boolFlags($physicalFounders, 'isIncapacitated'));
        $this->yesNoListRow($pdf, '1.2.4. Лишен в установленном порядке права заниматься деятельностью, связанной с производством и выпуском средств массовой информации', $this->boolFlags($physicalFounders, 'isDeprivedOfMediaRights'));
        $this->yesNoListRow($pdf, '1.2.5. На момент государственной регистрации средства массовой информации не прошло трех лет со дня вступления в силу решения суда о прекращении выпуска средства массовой информации, учредителем которого являлся', $this->boolFlags($physicalFounders, 'isMediaTerminated'));
        $this->pairRow($pdf, '1.2.6. Адрес (почтовый индекс, область, район, город, населенный пункт, улица (проспект, переулок и т.д.), номер дома, корпус, квартира (офис)', $this->stackTopLevel($physicalFounders, 'address'));
        $this->contactBlock($pdf, '1.2.7. Контактный телефон', $physicalFounders);
        $this->emailRow($pdf, $physicalFounders);
    }

    /**
     * @param array<string,mixed> $data
     */
    private function renderMainInfoRows(PDF $pdf, array $data): void
    {
        $main = is_array($data['mainInfo'] ?? null) ? $data['mainInfo'] : [];
        $this->pairRow($pdf, '2. Название средства массовой информации', $this->value($main['name'] ?? ''));
        $this->pairRow($pdf, '3. Вид средства массовой информации', $this->mediaKind($main));
    }

    /**
     * @param array<string,mixed> $data
     */
    private function renderOfficeSection(PDF $pdf, array $data): void
    {
        $office = is_array($data['office'] ?? null) ? $data['office'] : [];
        $owners = is_array($office['owners'] ?? null) ? array_values($office['owners']) : [];
        [$legalOwners, $physicalOwners] = $this->splitMixedItems($owners);

        $this->fullWidthHeader($pdf, '4. Юридическое лицо, на которое возложены функции редакции средства массовой информации');
        $this->pairRow($pdf, '4.1. Полное наименование юридического лица', $this->value($office['fullName'] ?? ''));
        $this->fullWidthHeader($pdf, '4.2. Сведения о собственниках имущества (учредителях, участниках) юридического лица, на которое возложены функции редакции средства массовой информации', 9.0);

        $this->yesNoListRow($pdf, 'Государственный орган (организация)', $this->stateFlags($legalOwners));
        $this->pairRow($pdf, '4.2.1. Полное наименование юридического лица (юридических лиц)', $this->stackTopLevel($legalOwners, 'name'));
        $this->pairRow($pdf, '4.2.1.1. Резидент какой страны', $this->stackTopLevel($legalOwners, 'country'));
        $this->pairRow($pdf, '4.2.1.2. Доля в уставном фонде', $this->stackTopLevelPercent($legalOwners, 'capitalPercent'));

        $nestedRows = $this->flattenNestedRowsFromParents($legalOwners, 'owners');
        $this->sideTitleTable(
            $pdf,
            'Учредители юридических лиц',
            'ФИО (наименование юр. лица)',
            'Гражданство (резидент какой страны)',
            'Доля в уставном фонде %',
            $nestedRows
        );

        $this->pairRow($pdf, '4.2.2. Фамилия имя отчество гражданина (граждан)', $this->stackTopLevel($physicalOwners, 'name'));
        $this->pairRow($pdf, '4.2.2.1. Гражданство', $this->stackTopLevel($physicalOwners, 'country'));
        $this->pairRow($pdf, '4.2.2.2. Доля в уставном фонде', $this->stackTopLevelPercent($physicalOwners, 'capitalPercent'));

        $chief = is_array($office['chiefEditor'] ?? null) ? $office['chiefEditor'] : [];
        $this->pairRow($pdf, '4.3. Фамилия, собственное имя, отчество (если таковое имеется) главного редактора (редактора) средства массовой информации', $this->value($chief['name'] ?? ''));
        $this->pairRow($pdf, '4.3.1. Данные акта, на основании которого принято решение о назначении на должность главного редактора (редактора)', $this->value($chief['actAssignment'] ?? ''));
        $this->yesNoSingleRow($pdf, '4.3.2. Главный редактор (редактор) средства массовой информации соответствует квалификационным требованиям, установленным законодательством Республики Беларусь', $this->nullableBool($chief['meetRequirements'] ?? null));
        $this->pairRow($pdf, '4.3.3. Учебное заведение, которое окончил главный редактор (редактор), год поступления(окончания)', $this->value($chief['institution'] ?? ''));
        $this->pairRow($pdf, '4.3.4. Сведения о работе главного редактора (редактора) на руководящих должностях (место работы, должность, период работы)', $this->value($chief['formerJobInfo'] ?? ''));
        $this->pairRow($pdf, '4.3.5 Гражданство', $this->value($chief['country'] ?? ''));

        $this->pairRow($pdf, '4.4. Адрес юридического лица, на которое возложены функции редакции средства массовой информации (почтовый индекс, область, район, город, населенный пункт, улица (проспект, переулок и т.д.), номер дома, корпус, квартира (офис)', $this->value($office['address'] ?? ''));
        $this->contactBlock($pdf, '4.4.1. Контактный телефон', [$office]);
        $this->emailRow($pdf, [$office]);
        $this->pairRow($pdf, '4.4.2. Адрес веб-сайта', $this->value($office['www'] ?? ''));
        $this->yesNoSingleRow($pdf, '4.4.3. Помещение, в котором размещается юридическое лицо, на которое возложены функции средства массовой информации, соответствует требованиям законодательства', $this->nullableBool($office['meetsLegalRqmts'] ?? null));
        $this->pairRow($pdf, '4.4.4. Юридическое лицо, на которое возложены функции редакции средства массовой информации, находиться в жилом помещении, нежилом помещении, в помещении, которое переведено из жилого в нежилое', $this->value($office['room'] ?? ''));
    }

    /**
     * @param array<string,mixed> $data
     */
    private function renderSpecializationAndDistribution(PDF $pdf, array $data): void
    {
        $main = is_array($data['mainInfo'] ?? null) ? $data['mainInfo'] : [];
        $this->pairRow($pdf, '5. Специализация(тематика) средства массовой информации', $this->specializationLine($main));

        $periodicityValue = $this->value($main['periodicity'] ?? '');
        $volume = $this->value($main['volumeVoice'] ?? '');
        $row6Value = $periodicityValue;
        if ($volume !== '') {
            $row6Value = $row6Value !== '' ? $row6Value . ', ' . $volume : $volume;
        }
        $this->pairRow($pdf, '6. Периодичность средства массовой информации (за исключением сетевого издания). Максимальный объем вещания (для телевизионного и радиовещательного средства массовой информации)', $row6Value);
        $this->pairRow($pdf, '6-1. Объем телепередач, аудиовизуальных произведений, иных сообщений и (или) материалов белорусского (национального) производства в ежемесячном объеме вещания телевизионных средств массовой информации (для телевизионного средства массовой информации)', $this->percent($main['bynVolume'] ?? null));
        $this->pairRow($pdf, '7. Язык средства массовой информации', $this->languageLine($main));
        $this->pairRow($pdf, '8. Предполагаемая территория распространения средства массовой информации', $this->distributionLine($main));
    }

    /**
     * @param array<string,mixed> $data
     */
    private function renderFinancingSection(PDF $pdf, array $data): void
    {
        $this->yesNoSingleRow($pdf, '9. Финансирование средства массовой информации соответствует требованиям законодательства', $this->nullableBool($data['financingMeetsLegalRqmts'] ?? null));
        $this->fullWidthHeader($pdf, '9.1. Источники финансирования средства массовой информации', 9.0);

        $sponsors = is_array($data['sponsors'] ?? null) ? array_values($data['sponsors']) : [];
        [$legalSponsors, $physicalSponsors] = $this->splitMixedItems($sponsors);

        $this->fullWidthHeader($pdf, '9.1.1. Поступающие от юридических лиц', 9.0);
        $this->pairRow($pdf, '9.1.1.1 Полное наименование юридического лица (юридических лиц)', $this->stackTopLevel($legalSponsors, 'name'));
        $this->pairRow($pdf, '9.1.1.2 Резидент какой страны', $this->stackTopLevel($legalSponsors, 'country'));
        $this->pairRow($pdf, '9.1.1.3 Доля в уставном фонде юридического лица, на которое возложены функции редакции средства массовой информации', $this->stackTopLevelPercent($legalSponsors, 'shareInCapital'));
        $this->pairRow($pdf, '9.1.1.4 Форма участия в финансировании (посредством участия в уставном фонде юридического лица, на которое возложены функции редакции средства массовой информации, другая форма)', $this->stackTopLevel($legalSponsors, 'participationForm'));

        $this->fullWidthHeader($pdf, '9.1.2 Поступающие от физических лиц, в том числе иностранных граждан и лиц без гражданства', 9.0);
        $this->pairRow($pdf, '9.1.2.1. Фамилия, собственное имя, отчество (если таковое имеется) гражданина (граждан), лица без гражданства (лиц без гражданства)', $this->stackTopLevel($physicalSponsors, 'name'));
        $this->pairRow($pdf, '9.1.2.2. Гражданство', $this->stackTopLevel($physicalSponsors, 'country'));
        $this->pairRow($pdf, '9.1.2.3. Место постоянного проживания', $this->stackTopLevel($physicalSponsors, 'address'));
        $this->pairRow($pdf, '9.1.2.4. Доля в уставном фонде юридического лица на которое возложены функции редакции средства массовой информации', $this->stackTopLevelPercent($physicalSponsors, 'shareInCapital'));
        $this->pairRow($pdf, '9.1.2.5 Форма участия в финансировании (посредством участия в уставном фонде юридического лица, на которое возложены функции редакции средства массовой информации, другая форма)', $this->stackTopLevel($physicalSponsors, 'participationForm'));
        $this->pairRow($pdf, '9.1.3. Другие источники', $this->value($data['otherSources'] ?? ''));
    }

    /**
     * @param array<string,mixed> $data
     */
    private function renderTailSection(PDF $pdf, array $data): void
    {
        $main = is_array($data['mainInfo'] ?? null) ? $data['mainInfo'] : [];
        $this->pairRow($pdf, '10. Предполагаемый тираж средства массовой информации (для печатного средства массовой информации)', $this->value($main['circulation'] ?? ''));

        $answer = $this->value($data['information'] ?? '');
        if ($answer === '' && array_key_exists('confirm', $data)) {
            $answer = $this->lowerYesNo($this->nullableBool($data['confirm']));
        }
        $this->pairRow(
            $pdf,
            '11. Сведения о том, является ли учредитель (учредители) средства массовой информации учредителем, главным редактором (редактором) или журналистом других средств массовой информации (для учредителя средства массовой информации - физического лица), распространителем продукции средства массовой информации',
            $answer
        );
    }

    private function fullWidthHeader(PDF $pdf, string $text, float $fontSize = 10.0): void
    {
        $pdf->TableRow([
            ['w' => self::PAGE_WIDTH, 'text' => $text, 'style' => 'B'],
        ], 4.4, 'DejaVu', $fontSize);
    }

    private function pairRow(PDF $pdf, string $label, string $value): void
    {
        $pdf->TableRow([
            ['w' => self::LABEL_W, 'text' => $label],
            ['w' => self::VALUE_W, 'text' => $value],
        ]);
    }

    private function yesNoSingleRow(PDF $pdf, string $label, ?bool $value): void
    {
        [$yesText, $noText] = $this->radioColumns($value, null);
        $pdf->TableRow([
            ['w' => self::LABEL_W, 'text' => $label],
            ['w' => self::YES_W, 'text' => $yesText],
            ['w' => self::NO_W, 'text' => $noText],
        ]);
    }

    /**
     * @param array<int, bool|null> $flags
     */
    private function yesNoListRow(PDF $pdf, string $label, array $flags): void
    {
        if ($flags === []) {
            $this->yesNoSingleRow($pdf, $label, null);
            return;
        }

        $yesLines = [];
        $noLines = [];
        foreach ($flags as $i => $flag) {
            [$yesText, $noText] = $this->radioColumns($flag, $i + 1);
            $yesLines[] = $yesText;
            $noLines[] = $noText;
        }

        $pdf->TableRow([
            ['w' => self::LABEL_W, 'text' => $label],
            ['w' => self::YES_W, 'text' => implode("\n", $yesLines)],
            ['w' => self::NO_W, 'text' => implode("\n", $noLines)],
        ]);
    }

    /**
     * @param array<int, array<string,mixed>> $items
     */
    private function contactBlock(PDF $pdf, string $label, array $items): void
    {
        $this->fullWidthHeader($pdf, $label, 9.4);

        $codes = [];
        $phones = [];
        $faxes = [];

        foreach ($items as $i => $item) {
            $codes[] = ($i + 1) . '. Код ' . $this->value($item['phoneCode'] ?? '');
            $phones[] = 'Телефон ' . $this->value($item['phone'] ?? '');
            $faxes[] = 'Факс ' . $this->value($item['fax'] ?? '');
        }

        $pdf->TableRow([
            ['w' => self::SMALL_COL_W, 'text' => implode("\n", $codes)],
            ['w' => self::SMALL_COL_W, 'text' => implode("\n", $phones)],
            ['w' => self::SMALL_COL_W, 'text' => implode("\n", $faxes)],
        ]);
    }

    /**
     * @param array<int, array<string,mixed>> $items
     */
    private function emailRow(PDF $pdf, array $items): void
    {
        $emails = [];
        foreach ($items as $i => $item) {
            $email = $this->value($item['email'] ?? '');
            $emails[] = ($i + 1) . '. ' . $email;
        }
        $this->pairRow($pdf, 'Адрес электронной почты', implode("\n", $emails));
    }

    /**
     * @param array<int, array{num:string,name:string,country:string,share:string}> $rows
     */
    private function sideTitleTable(PDF $pdf, string $sideTitle, string $header1, string $header2, string $header3, array $rows): void
    {
        if ($rows === []) {
            return;
        }

        $remaining = $rows;
        $lineHeight = 4.1;
        $headerCells = [
            ['w' => self::SIDE_COL1_W, 'text' => $header1],
            ['w' => self::SIDE_COL2_W, 'text' => $header2],
            ['w' => self::SIDE_COL3_W, 'text' => $header3],
        ];
        $headerHeight = $this->rowHeight($pdf, $headerCells, $lineHeight);

        while ($remaining !== []) {
            $segment = [];
            $segmentHeight = $headerHeight;
            $available = $pdf->PageBreakTrigger - $pdf->GetY();

            foreach ($remaining as $idx => $row) {
                $rowCells = [
                    ['w' => self::SIDE_COL1_W, 'text' => $row['num'] . ' ' . $row['name']],
                    ['w' => self::SIDE_COL2_W, 'text' => $row['country']],
                    ['w' => self::SIDE_COL3_W, 'text' => $row['share']],
                ];
                $rowHeight = $this->rowHeight($pdf, $rowCells, $lineHeight);

                if ($segment === []) {
                    if ($segmentHeight + $rowHeight > $available && $available < 40) {
                        $pdf->AddPage($pdf->CurOrientation);
                        $available = $pdf->PageBreakTrigger - $pdf->GetY();
                    }
                }

                if ($segment !== [] && $segmentHeight + $rowHeight > $available) {
                    break;
                }

                $segment[] = $row;
                $segmentHeight += $rowHeight;
                unset($remaining[$idx]);
            }

            $remaining = array_values($remaining);
            $this->drawSideTitleTableSegment($pdf, $sideTitle, $headerCells, $segment, $lineHeight, $segmentHeight);
        }
    }

    /**
     * @param array<int, array{w:float|string,text:string}> $headerCells
     * @param array<int, array{num:string,name:string,country:string,share:string}> $rows
     */
    private function drawSideTitleTableSegment(PDF $pdf, string $sideTitle, array $headerCells, array $rows, float $lineHeight, float $totalHeight): void
    {
        $pdf->CheckPageBreak($totalHeight);
        $x = $pdf->GetX();
        $y = $pdf->GetY();

        $pdf->Rect($x, $y, self::SIDE_TITLE_W, $totalHeight);
        $pdf->SetXY($x, $y + 0.8);
        $pdf->SetFont('DejaVu', '', 9.4);
        $pdf->MultiCell(self::SIDE_TITLE_W, $lineHeight, $sideTitle, 0, 'L');

        $rightX = $x + self::SIDE_TITLE_W;
        $currentY = $y;

        $pdf->SetXY($rightX, $currentY);
        $pdf->TableRow([
            ['w' => self::SIDE_COL1_W, 'text' => $headerCells[0]['text']],
            ['w' => self::SIDE_COL2_W, 'text' => $headerCells[1]['text']],
            ['w' => self::SIDE_COL3_W, 'text' => $headerCells[2]['text']],
        ], $lineHeight);
        $currentY = $pdf->GetY();

        foreach ($rows as $row) {
            $pdf->SetXY($rightX, $currentY);
            $pdf->TableRow([
                ['w' => self::SIDE_COL1_W, 'text' => $row['num'] . ' ' . $row['name']],
                ['w' => self::SIDE_COL2_W, 'text' => $row['country']],
                ['w' => self::SIDE_COL3_W, 'text' => $row['share']],
            ], $lineHeight);
            $currentY = $pdf->GetY();
        }

        $pdf->SetXY($x, $y + $totalHeight);
    }

    /**
     * @param array<int, array{w:float|string,text:string}> $cells
     */
    private function rowHeight(PDF $pdf, array $cells, float $lineHeight): float
    {
        $maxLines = 1;
        foreach ($cells as $cell) {
            $maxLines = max($maxLines, $pdf->NbLinesUtf8((float)$cell['w'], (string)$cell['text']));
        }
        return max(6.4, $maxLines * $lineHeight + 1.6);
    }

    /**
     * @return array{0:string,1:string}
     */
    private function radioColumns(?bool $value, ?int $index): array
    {
        if ($value === null) {
            return ['', ''];
        }

        $prefix = $index !== null ? $index . '. ' : '';
        $yes = $value ? '◉ Да' : '○ Да';
        $no = $value ? '○ Нет' : '◉ Нет';

        return [$prefix . $yes, $no];
    }

    /**
     * @param array<string,mixed> $data
     * @return array{0:array<int,array<string,mixed>>,1:array<int,array<string,mixed>>}
     */
    private function splitFounders(array $data): array
    {
        $items = [];
        if (is_array($data['founders'] ?? null)) {
            $items = array_merge($items, array_values($data['founders']));
        }
        if (is_array($data['founders_phys'] ?? null)) {
            $items = array_merge($items, array_values($data['founders_phys']));
        }

        return $this->splitMixedItems($items);
    }

    /**
     * @param array<int, mixed> $items
     * @return array{0:array<int,array<string,mixed>>,1:array<int,array<string,mixed>>}
     */
    private function splitMixedItems(array $items): array
    {
        $legal = [];
        $physical = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            if ($this->isLegalItem($item)) {
                $legal[] = $item;
            } else {
                $physical[] = $item;
            }
        }
        return [$legal, $physical];
    }

    /**
     * @param array<string,mixed> $item
     */
    private function isLegalItem(array $item): bool
    {
        $typeFace = (string)($item['typeFace'] ?? '');
        if ($typeFace === 'jurFace') {
            return true;
        }
        if ($typeFace === 'fizFace') {
            return false;
        }
        return array_key_exists('capitalPercent', $item) || array_key_exists('isState', $item) || array_key_exists('founders', $item) || array_key_exists('owners', $item);
    }

    /**
     * @param array<int, array<string,mixed>> $items
     * @return array<int, bool|null>
     */
    private function stateFlags(array $items): array
    {
        $result = [];
        foreach ($items as $item) {
            $result[] = $this->nullableBool($item['isState'] ?? null);
        }
        return $result;
    }

    /**
     * @param array<int, array<string,mixed>> $items
     * @return array<int, bool|null>
     */
    private function boolFlags(array $items, string $field): array
    {
        $result = [];
        foreach ($items as $item) {
            $result[] = $this->nullableBool($item[$field] ?? null);
        }
        return $result;
    }

    /**
     * @param array<int, array<string,mixed>> $items
     */
    private function stackTopLevel(array $items, string $field): string
    {
        $lines = [];
        foreach ($items as $i => $item) {
            $value = $this->fieldValue($item, $field);
            if ($value === '') {
                continue;
            }
            $lines[] = ($i + 1) . '. ' . $value;
        }
        return implode("\n", $lines);
    }

    /**
     * @param array<int, array<string,mixed>> $items
     */
    private function stackTopLevelPercent(array $items, string $field): string
    {
        $lines = [];
        foreach ($items as $i => $item) {
            $value = $this->percent($item[$field] ?? null);
            if ($value === '') {
                continue;
            }
            $lines[] = ($i + 1) . '. ' . $value;
        }
        return implode("\n", $lines);
    }

    /**
     * @param array<string,mixed> $item
     */
    private function fieldValue(array $item, string $field): string
    {
        if ($field === 'name') {
            return $this->displayName($item);
        }
        return $this->value($item[$field] ?? '');
    }

    /**
     * @param array<string,mixed> $item
     */
    private function displayName(array $item): string
    {
        return $this->value($item['name'] ?? $item['fullName'] ?? '');
    }

    /**
     * @param array<int, array<string,mixed>> $parents
     * @return array<int, array{num:string,name:string,country:string,share:string}>
     */
    private function flattenNestedRowsFromParents(array $parents, string $childrenKey): array
    {
        $rows = [];
        foreach ($parents as $i => $parent) {
            $children = $parent[$childrenKey] ?? [];
            if (!is_array($children) || $children === []) {
                continue;
            }
            $prefix = (string)($i + 1) . '.';
            $rows = array_merge($rows, $this->flattenNestedRows($children, $prefix, $childrenKey));
        }
        return $rows;
    }

    /**
     * @param array<int, array<string,mixed>> $items
     * @return array<int, array{num:string,name:string,country:string,share:string}>
     */
    private function flattenNestedRows(array $items, string $prefix, string $childrenKey): array
    {
        $rows = [];
        foreach ($items as $i => $item) {
            $num = $prefix . ($i + 1) . '.';
            $rows[] = [
                'num' => rtrim($num, '.'),
                'name' => $this->displayName($item),
                'country' => $this->value($item['country'] ?? $item['citizenship'] ?? ''),
                'share' => $this->value($item['capitalPercent'] ?? ''),
            ];

            $nested = $item[$childrenKey] ?? [];
            if (is_array($nested) && $nested !== []) {
                $rows = array_merge($rows, $this->flattenNestedRows($nested, $num, $childrenKey));
            }
        }
        return $rows;
    }

    /**
     * @param array<string,mixed> $main
     */
    private function mediaKind(array $main): string
    {
        $kind = $this->value($main['kindSmi'] ?? '');
        if ($kind === 'Другое') {
            return $this->value($main['kindSmiOther'] ?? '');
        }
        return $kind;
    }

    /**
     * @param array<string,mixed> $main
     */
    private function specializationLine(array $main): string
    {
        $parts = [];
        if (is_array($main['specialization'] ?? null)) {
            foreach ($main['specialization'] as $value) {
                $text = $this->value($value);
                if ($text !== '') {
                    $parts[] = $text;
                }
            }
        }
        $other = $this->value($main['specializationOther'] ?? '');
        if ($other !== '') {
            $parts[] = $other;
        }
        return implode(",\n", $parts);
    }

    /**
     * @param array<string,mixed> $main
     */
    private function languageLine(array $main): string
    {
        $parts = [];
        if (is_array($main['language'] ?? null)) {
            foreach ($main['language'] as $lang) {
                $text = $this->value($lang);
                if ($text !== '') {
                    $parts[] = $text;
                }
            }
        }

        $other = $this->value($main['languageOther'] ?? '');
        $otherText = $this->value($main['languageOtherText'] ?? '');
        if ($other !== '') {
            $parts[] = trim(($otherText !== '' ? $otherText . ' ' : '') . $other);
        }

        return implode(', ', $parts);
    }

    /**
     * @param array<string,mixed> $main
     */
    private function distributionLine(array $main): string
    {
        $territory = $this->value($main['distributionTerritory'] ?? '');
        $detail = $this->value($main['distributionTerritoryDetail'] ?? '');
        $detailExtra = $this->value($main['distributionTerritoryDetailExtra'] ?? '');

        $parts = [];
        if ($territory !== '') {
            $parts[] = $territory;
        }
        if ($detail !== '') {
            $parts[] = $detail;
        }
        if ($detailExtra !== '' && $detailExtra !== $detail) {
            $parts[] = $detailExtra;
        }
        return implode(' ', $parts);
    }

    private function buildDocumentBaseName(array $data): string
    {
        $main = is_array($data['mainInfo'] ?? null) ? $data['mainInfo'] : [];
        $type = $this->filePart((string)($main['typeSmi'] ?? 'СМИ'));
        $type = preg_replace('/_?СМИ$/u', '', $type ?? '') ?: 'СМИ';
        $name = $this->filePart((string)($main['name'] ?? 'Без_названия'));
        return trim($type . '_' . $name . '_' . date('d_m_Y_H_i_s') . '_' . substr(uniqid('', true), -12), '_');
    }

    private function saveResult(PDF $pdf, array $data): string
    {
        $outDir = $this->uploadsBasePath . DIRECTORY_SEPARATOR . date('Y-m-d_H-i-s') . '_smi';
        if (!is_dir($outDir)) {
            @mkdir($outDir, 0755, true);
        }

        $jsonFile = $outDir . DIRECTORY_SEPARATOR . 'input.json';
        file_put_contents($jsonFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        $outFile = $outDir . DIRECTORY_SEPARATOR . $this->currentBaseName . '.pdf';
        $pdf->Output('F', $outFile);
        return $outFile;
    }

    /**
     * @param string|array<mixed> $payload
     * @return array<string,mixed>
     */
    private function normalizeData($payload): array
    {
        if (is_array($payload)) {
            return $payload;
        }
        $data = json_decode((string)$payload, true);
        if (!is_array($data)) {
            throw new InvalidArgumentException('Некорректный JSON');
        }
        return $data;
    }

    /**
     * @param mixed $value
     */
    private function nullableBool($value): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_bool($value)) {
            return $value;
        }
        if (is_numeric($value)) {
            return ((int)$value) !== 0;
        }
        $normalized = mb_strtolower(trim((string)$value));
        if (in_array($normalized, ['true', '1', 'да', 'yes'], true)) {
            return true;
        }
        if (in_array($normalized, ['false', '0', 'нет', 'no'], true)) {
            return false;
        }
        return null;
    }

    /**
     * @param mixed $value
     */
    private function value($value): string
    {
        if ($value === null) {
            return '';
        }
        if (is_bool($value)) {
            return $value ? 'Да' : 'Нет';
        }
        if (is_scalar($value)) {
            return trim((string)$value);
        }
        return '';
    }

    /**
     * @param mixed $value
     */
    private function percent($value): string
    {
        $text = $this->value($value);
        if ($text === '') {
            return '';
        }
        return rtrim($text, '%') . '%';
    }

    private function lowerYesNo(?bool $value): string
    {
        if ($value === null) {
            return '';
        }
        return $value ? 'да' : 'нет';
    }

    private function filePart(string $value): string
    {
        $value = trim($value);
        $value = preg_replace('/\s+/u', '_', $value) ?? $value;
        $value = preg_replace('/[^\pL\pN_\-]+/u', '_', $value) ?? $value;
        $value = preg_replace('/_+/u', '_', $value) ?? $value;
        return trim($value, '_');
    }
}

// HTTP API: POST с JSON в теле — тот же контракт, что saveJsonData() в контроллере
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    try {
        $raw = file_get_contents('php://input');
        $rawTrim = is_string($raw) ? trim($raw) : '';
        if ($rawTrim === '') {
            throw new InvalidArgumentException('Некорректный JSON');
        }

        $generator = new SmiPdfGenerator('uploads/files/form');
        $path = $generator->generate($rawTrim);

        // При встраивании в приложение: сохранение строки в БД, например $this->createRow($path);

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['message' => 'Заявка успешно принята'], JSON_UNESCAPED_UNICODE);
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['errors' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['errors' => ['Ошибка при формировании заявления']], JSON_UNESCAPED_UNICODE);
    }
    exit;
}