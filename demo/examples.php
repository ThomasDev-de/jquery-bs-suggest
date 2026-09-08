<?php
/** Demo endpoint: plain items let each example control its own renderer. */
header('Content-Type: application/json; charset=utf-8');
try {
    $countries = json_decode(file_get_contents(__DIR__ . '/countries.json'), true, 512, JSON_THROW_ON_ERROR);
    $region = filter_input(INPUT_GET, 'region');
    $grouped = filter_input(INPUT_GET, 'grouped') === '1';
    $rich = filter_input(INPUT_GET, 'rich') === '1';
    $items = [];
    foreach ($countries as $country) {
        if ($region && $country['group'] !== $region) {
            continue;
        }
        $item = ['id' => $country['id'], 'text' => $country['text'], 'subtext' => $country['subtext'] ?? $country['group']];
        if ($grouped) {
            $item['group'] = $country['group'];
        }
        if ($rich) {
            $name = htmlspecialchars($item['text'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $group = htmlspecialchars($country['group'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $item['formatted'] = '<div class="d-flex align-items-center gap-3 py-1"><i class="bi bi-globe2 fs-4 text-primary" aria-hidden="true"></i><div><div class="fw-semibold">' . $name . '</div><div class="small text-body-secondary">' . $group . '</div></div></div>';
        }
        $items[] = $item;
    }
    $value = filter_input(INPUT_GET, 'value');
    $values = filter_input(INPUT_GET, 'value', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY);
    if (is_array($values)) {
        $ids = array_map('strval', $values);
        $resolved = array_values(array_filter($items, static fn($item) => in_array((string) $item['id'], $ids, true)));
        $response = ['items' => $resolved, 'total' => count($resolved)];
    } elseif ($value !== null && $value !== false && $value !== '') {
        $resolved = array_values(array_filter($items, static fn($item) => (string) $item['id'] === $value));
        $response = $resolved[0] ?? null;
    } else {
        $q = strtolower(trim(filter_input(INPUT_GET, 'q') ?: ''));
        $limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT);
        $limit = max(1, min(100, $limit ?: 20));
        $matches = array_values(array_filter($items, static fn($item) => $q === '' || str_contains(strtolower($item['text']), $q)));
        $response = ['items' => array_slice($matches, 0, $limit), 'total' => count($matches)];
    }
    echo json_encode($response, JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load the example data.']);
}
