<?php
declare(strict_types=1);

function validateSmiJson(array $data): array {
    $errors = [];

    $add = static function (string $msg) use (&$errors): void {
        $errors[] = $msg;
    };

    $get = static function (array $arr, string $key) {
        return $arr[$key] ?? null;
    };

    $trim = static function ($v): string {
        if ($v === null) return '';
        if (is_string($v)) return trim($v);
        if (is_numeric($v) || is_bool($v)) return (string) $v;
        return '';
    };

    $isEmpty = static function ($v): bool {
        if ($v === null) return true;
        if (is_string($v)) return trim($v) === '';
        if (is_array($v)) return count($v) === 0;
        return false;
    };
    
    $validEmail = static function (string $v): bool {
        return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $v);
    };
    $validPhone = static function (string $v): bool {
        return (bool) preg_match('/^[0-9+()\-\s]{5,}$/', $v);
    };
    $validPhoneCode = static function (string $v): bool {
        return (bool) preg_match('/^\d{2,6}$/', $v);
    };
    $validPercent = static function ($v, float $max = 100): bool {
        $n = is_numeric($v) ? (float) str_replace(',', '.', (string) $v) : NAN;
        return is_finite($n) && $n >= 0 && $n <= $max;
    };

    // --- Шаг 1: mainInfo ---
    $main = $data['mainInfo'] ?? [];
    if (!is_array($main)) {
        $add('mainInfo: ожидается объект');
    } else {
        if ($isEmpty($get($main, 'name'))) $add('mainInfo.name: поле обязательно');
        if ($isEmpty($get($main, 'typeSmi'))) $add('mainInfo.typeSmi: поле обязательно');
        if ($isEmpty($get($main, 'kindSmi'))) $add('mainInfo.kindSmi: поле обязательно');

        if ($trim($get($main, 'kindSmi') ?? '') === 'Другое' && $isEmpty($get($main, 'kindSmiOther'))) {
            $add('mainInfo.kindSmiOther: укажите вид при выборе «Другое»');
        }

        $spec = $main['specialization'] ?? [];
        if (!is_array($spec) || count($spec) === 0) {
            $add('mainInfo.specialization: выберите хотя бы один вариант');
        }

        $subj = $main['subjects'] ?? [];
        if (!is_array($subj) || count($subj) === 0) {
            $add('mainInfo.subjects: выберите хотя бы один вариант');
        }

        if (!empty($main['specializationOtherEnabled']) && $isEmpty($get($main, 'specializationOther'))) {
            $add('mainInfo.specializationOther: заполните при включённой доп. специализации');
        }
        if (!empty($main['subjectsOtherEnabled']) && $isEmpty($get($main, 'subjectsOther'))) {
            $add('mainInfo.subjectsOther: заполните при включённой доп. тематике');
        }

        if ($isEmpty($get($main, 'distributionTerritoryDetailExtra'))) {
            $add('mainInfo.distributionTerritoryDetailExtra: поле обязательно');
        }

        if (($trim($main['periodicity'] ?? '') === 'Другое') && $isEmpty($get($main, 'periodicityOther'))) {
            $add('mainInfo.periodicityOther: заполните при выборе «Другое»');
        }
        if (($trim($main['volumeVoice'] ?? '') === 'Другое') && $isEmpty($get($main, 'volumeVoiceOther'))) {
            $add('mainInfo.volumeVoiceOther: заполните при выборе «Другое»');
        }
        if (($trim($main['distributionTerritory'] ?? '') === 'Другое') && $isEmpty($get($main, 'distributionTerritoryDetail'))) {
            $add('mainInfo.distributionTerritoryDetail: заполните при выборе «Другое»');
        }

        $langOther = $main['languageOther'] ?? null;
        if ($langOther !== null && $langOther !== '' && $langOther !== [] && $isEmpty($get($main, 'languageOtherText'))) {
            $add('mainInfo.languageOtherText: заполните при выборе «Другое» по языкам');
        }

        $bynVol = $main['bynVolume'] ?? null;
        if ($bynVol !== null && $bynVol !== '' && !$validPercent($bynVol, 100)) {
            $add('mainInfo.bynVolume: укажите значение от 0 до 100');
        }
    }

    // --- Шаг 2: founders ИЛИ domainOwner ---
    $founders = $data['founders'] ?? [];
    $foundersPhys = $data['founders_phys'] ?? [];
    $merged = array_merge(
        is_array($founders) ? $founders : [],
        is_array($foundersPhys) ? $foundersPhys : []
    );
    $domainOwner = $data['domainOwner'] ?? [];
    $hasFounders = count($merged) > 0;
    $hasDomainOwner = is_array($domainOwner) && (
        $trim($domainOwner['name'] ?? '') !== '' ||
        $trim($domainOwner['domainName'] ?? '') !== ''
    );

    if (!$hasFounders && !$hasDomainOwner) {
        $add('Шаг 2: необходимо заполнить учредителей или владельца сетевого издания');
    } elseif ($hasDomainOwner) {
        $d = $domainOwner;
        if ($isEmpty($get($d, 'name'))) $add('domainOwner.name: поле обязательно');
        if ($isEmpty($get($d, 'country'))) $add('domainOwner.country: поле обязательно');
        if ($isEmpty($get($d, 'address'))) $add('domainOwner.address: поле обязательно');
        if ($isEmpty($get($d, 'phoneCode'))) $add('domainOwner.phoneCode: поле обязательно');
        if ($isEmpty($get($d, 'phone'))) $add('domainOwner.phone: поле обязательно');
        if ($isEmpty($get($d, 'email'))) $add('domainOwner.email: поле обязательно');
        if (!$validPhoneCode($trim($d['phoneCode'] ?? ''))) $add('domainOwner.phoneCode: корректный код (2–6 цифр)');
        if (!$validPhone($trim($d['phone'] ?? ''))) $add('domainOwner.phone: корректный номер');
        if (!$validEmail($trim($d['email'] ?? ''))) $add('domainOwner.email: корректный адрес');

        $typeFace = $trim($d['typeFace'] ?? '');
        if ($typeFace === 'jurFace') {
            $cap = $d['capitalPercent'] ?? null;
            if ($cap === null || $cap === '') {
                $add('domainOwner.capitalPercent: поле обязательно для юр. лица');
            } elseif (!$validPercent($cap, 20)) {
                $add('domainOwner.capitalPercent: для юр. лица диапазон от 0 до 20');
            }
        }
    } else {
        foreach ($merged as $i => $f) {
            if (!is_array($f)) continue;
            $typeFace = $trim($f['typeFace'] ?? '');
            $isJur = $typeFace === 'jurFace' || array_key_exists('capitalPercent', $f) || array_key_exists('isState', $f);

            if ($isJur) {
                if ($isEmpty($get($f, 'name'))) $add("founders[{$i}].name: поле обязательно");
                if ($isEmpty($get($f, 'country'))) $add("founders[{$i}].country: поле обязательно");
                if ($isEmpty($get($f, 'address'))) $add("founders[{$i}].address: поле обязательно");
                if ($isEmpty($get($f, 'phoneCode'))) $add("founders[{$i}].phoneCode: поле обязательно");
                if ($isEmpty($get($f, 'phone'))) $add("founders[{$i}].phone: поле обязательно");
                if ($isEmpty($get($f, 'email'))) $add("founders[{$i}].email: поле обязательно");
                if (!$validPhoneCode($trim($f['phoneCode'] ?? ''))) $add("founders[{$i}].phoneCode: корректный код");
                if (!$validPhone($trim($f['phone'] ?? ''))) $add("founders[{$i}].phone: корректный номер");
                if (!$validEmail($trim($f['email'] ?? ''))) $add("founders[{$i}].email: корректный адрес");

                $cap = $f['capitalPercent'] ?? null;
                if (isStateOrg($f)) {
                    // госорган — capitalPercent не обязателен
                } else {
                    if ($cap === null || $cap === '') $add("founders[{$i}].capitalPercent: поле обязательно");
                    elseif (!$validPercent($cap, 20)) $add("founders[{$i}].capitalPercent: диапазон от 0 до 20");
                }

                if (!isStateOrg($f)) {
                    $nestErr = validateNestedFoundersSum($f['founders'] ?? [], "founders[{$i}].founders");
                    foreach ($nestErr as $e) $add($e);
                }
            } else {
                if ($isEmpty($get($f, 'fullName'))) $add("founders[{$i}].fullName: поле обязательно");
                if ($isEmpty($get($f, 'citizenship'))) $add("founders[{$i}].citizenship: поле обязательно");
                if ($isEmpty($get($f, 'address'))) $add("founders[{$i}].address: поле обязательно");
                if ($isEmpty($get($f, 'phoneCode'))) $add("founders[{$i}].phoneCode: поле обязательно");
                if ($isEmpty($get($f, 'phone'))) $add("founders[{$i}].phone: поле обязательно");
                if ($isEmpty($get($f, 'email'))) $add("founders[{$i}].email: поле обязательно");
                if (!$validPhoneCode($trim($f['phoneCode'] ?? ''))) $add("founders[{$i}].phoneCode: корректный код");
                if (!$validPhone($trim($f['phone'] ?? ''))) $add("founders[{$i}].phone: корректный номер");
                if (!$validEmail($trim($f['email'] ?? ''))) $add("founders[{$i}].email: корректный адрес");

                if (!empty($f['isServingSentence']) || !empty($f['isIncapacitated']) || !empty($f['isDeprivedOfMediaRights']) || !empty($f['isMediaTerminated'])) {
                    $add("founders[{$i}]: по ограничениям все ответы должны быть «нет»");
                }
            }
        }
    }

    // --- Шаг 3: office ---
    $office = $data['office'] ?? [];
    if (!is_array($office)) {
        $add('office: ожидается объект');
    } else {
        if ($isEmpty($get($office, 'fullName'))) $add('office.fullName: поле обязательно');
        if ($isEmpty($get($office, 'country'))) $add('office.country: поле обязательно');
        if ($isEmpty($get($office, 'address'))) $add('office.address: поле обязательно');
        if ($isEmpty($get($office, 'phoneCode'))) $add('office.phoneCode: поле обязательно');
        if ($isEmpty($get($office, 'phone'))) $add('office.phone: поле обязательно');
        if ($isEmpty($get($office, 'email'))) $add('office.email: поле обязательно');
        if ($isEmpty($get($office, 'room'))) $add('office.room: поле обязательно');
        if (!$validPhoneCode($trim($office['phoneCode'] ?? ''))) $add('office.phoneCode: корректный код');
        if (!$validPhone($trim($office['phone'] ?? ''))) $add('office.phone: корректный номер');
        if (!$validEmail($trim($office['email'] ?? ''))) $add('office.email: корректный адрес');

        if (array_key_exists('meetsLegalRqmts', $office) && ($office['meetsLegalRqmts'] === false || $office['meetsLegalRqmts'] === 'false')) {
            $add('office.meetsLegalRqmts: помещение должно соответствовать требованиям законодательства');
        }

        $owners = $office['owners'] ?? [];
        if (!is_array($owners) || count($owners) === 0) {
            $add('office.owners: необходимо добавить хотя бы одного собственника имущества');
        } else {
            $ownerErr = validateOwnersBlock($owners, 'office.owners');
            foreach ($ownerErr as $e) $add($e);
        }

        $chief = $office['chiefEditor'] ?? [];
        if (is_array($chief)) {
            if ($isEmpty($get($chief, 'name'))) $add('office.chiefEditor.name: поле обязательно');
            if ($isEmpty($get($chief, 'country'))) $add('office.chiefEditor.country: поле обязательно');
            if ($isEmpty($get($chief, 'actAssignment'))) $add('office.chiefEditor.actAssignment: поле обязательно');
            if ($isEmpty($get($chief, 'institution'))) $add('office.chiefEditor.institution: поле обязательно');
            if ($isEmpty($get($chief, 'formerJobInfo'))) $add('office.chiefEditor.formerJobInfo: поле обязательно');
            if (array_key_exists('meetRequirements', $chief) && ($chief['meetRequirements'] === false || $chief['meetRequirements'] === 'false')) {
                $add('office.chiefEditor.meetRequirements: главный редактор должен соответствовать квалификационным требованиям');
            }
        }
    }

    // --- Шаг 5 ---
    if (array_key_exists('financingMeetsLegalRqmts', $data) && ($data['financingMeetsLegalRqmts'] === false || $data['financingMeetsLegalRqmts'] === 'false')) {
        $add('financingMeetsLegalRqmts: финансирование должно соответствовать требованиям законодательства');
    }

    $sponsors = $data['sponsors'] ?? [];
    if (!is_array($sponsors) || count($sponsors) === 0) {
        $add('sponsors: необходимо заполнить источники поступления средств');
    } else {
        foreach ($sponsors as $i => $s) {
            if (!is_array($s)) continue;
            if ($isEmpty($get($s, 'name'))) $add("sponsors[{$i}].name: поле обязательно");
            if ($isEmpty($get($s, 'country'))) $add("sponsors[{$i}].country: поле обязательно");
            if ($isEmpty($get($s, 'shareInCapital'))) $add("sponsors[{$i}].shareInCapital: поле обязательно");
            elseif (!$validPercent($s['shareInCapital'], 100)) $add("sponsors[{$i}].shareInCapital: значение от 0 до 100");
            if ($isEmpty($get($s, 'participationForm'))) $add("sponsors[{$i}].participationForm: поле обязательно");
            if (($s['typeFace'] ?? '') === 'fizFace' && $isEmpty($get($s, 'address'))) {
                $add("sponsors[{$i}].address: поле обязательно для физ. лица");
            }
        }
    }

    return [
        'ok' => count($errors) === 0,
        'errors' => $errors,
    ];
}

function isStateOrg($it): bool {
    if (!is_array($it)) return false;
    $v = $it['isState'] ?? null;
    return $v === true || $v === 'true';
}

function validateNestedFoundersSum(array $items, string $path): array {
    $err = [];
    if (count($items) === 0) return $err;
    $total = 0;
    foreach ($items as $it) {
        if (!is_array($it)) continue;
        $v = $it['capitalPercent'] ?? '';
        $n = is_numeric($v) ? (float) str_replace(',', '.', (string) $v) : 0;
        $total += $n;
    }
    $total = round($total * 100) / 100;
    if (abs($total - 100.0) > 0.001) {
        $err[] = "{$path}: сумма долей должна быть ровно 100%";
    }
    foreach ($items as $i => $it) {
        if (!is_array($it) || isStateOrg($it)) continue;
        $nested = $it['founders'] ?? [];
        if (is_array($nested) && count($nested) > 0) {
            $sub = validateNestedFoundersSum($nested, "{$path}[{$i}].founders");
            foreach ($sub as $e) $err[] = $e;
        }
    }
    return $err;
}

function validateOwnersBlock(array $items, string $path): array {
    $err = [];
    if (count($items) === 0) return $err;
    $total = 0;
    foreach ($items as $it) {
        if (!is_array($it)) continue;
        $v = $it['capitalPercent'] ?? '';
        $n = is_numeric($v) ? (float) str_replace(',', '.', (string) $v) : 0;
        $total += $n;
    }
    $total = round($total * 100) / 100;
    if (abs($total - 100.0) > 0.001) {
        $err[] = "{$path}: сумма долей всех собственников должна быть ровно 100%";
    }
    foreach ($items as $i => $it) {
        if (!is_array($it) || isStateOrg($it)) continue;
        $nested = $it['owners'] ?? [];
        if (is_array($nested) && count($nested) > 0) {
            $sub = validateOwnersBlock($nested, "{$path}[{$i}].owners");
            foreach ($sub as $e) $err[] = $e;
        }
    }
    return $err;
}
