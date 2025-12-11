<?php
/**
 * Note: PHP8.0 or higher is required for this script.
 */
header('Content-Type: application/json');

try {
    // Fetch a test data set
    /** @var stdClass[] $countries */
    $countries = json_decode(file_get_contents('countries.json'), false, 512, JSON_THROW_ON_ERROR);

    // Try to find the query parameter value
    $value = filter_input(INPUT_GET, 'value', FILTER_VALIDATE_INT); // FILTER_VALIDATE_INT sample

    /** @var null|stdClass|array $return */
    $return = null;

    // Was the value parameter found?
    $fetchSingleData = ! empty($value);

    // if yes
    if ($fetchSingleData)
    {
        // Get the record using the value parameter
        $data = array_values(array_filter($countries, static function($country) use ($value){
            return $country->id === $value;
        }));
        $c = $data[0] ?? null;
        if ($c !== null) {
            // Prefer pre-defined formatted from JSON if present; else build default
            $formatted = property_exists($c, 'formatted') && !empty($c->formatted)
                ? $c->formatted
                : (function($c){
                    $sub = $c->subtext ?? null;
                    return '<div class="w-100 rounded-2 px-2 py-1">'
                        . '<div class="fw-semibold">' . htmlspecialchars($c->text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</div>'
                        . (!empty($sub) ? '<div class="small opacity-75 mt-1">' . htmlspecialchars($sub, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</div>' : '')
                        . '</div>';
                })($c);
            $return = [
                'id' => $c->id,
                'text' => $c->text,
                'subtext' => $c->subtext ?? null,
                'formatted' => $formatted,
            ];
            if (!empty($c->group)) {
                $return['group'] = $c->group;
            }
        }
    }
    // if no
    else
    {
        $data = [];
        // Get parameter q and limit
        $limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT);
        $q = filter_input(INPUT_GET, 'q');
        $search = empty($q)? false : strtolower($q);

		if (false === $search){
			$min = min($limit, count($countries));
            for($i = 0; $i < $min; $i++){
                $c = $countries[$i];
                // Use provided formatted if available, otherwise generate
                $formatted = property_exists($c, 'formatted') && !empty($c->formatted)
                    ? $c->formatted
                    : (function($c){
                        $sub = $c->subtext ?? null;
                        return '<div class="w-100 rounded-2 px-2 py-1">'
                            . '<div class="fw-semibold">' . htmlspecialchars($c->text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</div>'
                            . (!empty($sub) ? '<div class="small opacity-75 mt-1">' . htmlspecialchars($sub, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</div>' : '')
                            . '</div>';
                    })($c);
                $d = [
                    'id' => $c->id,
                    'text' => $c->text,
                    'subtext' => $c->subtext ?? null,
                    'formatted' => $formatted,
                ];
                if (!empty($c->group)){
                    $d['group'] = $c->group;
                }

                $data[] = $d;
            }
        }
        else {
            // If q was not passed or is empty, do not return any results either.
            // Otherwise, search for matches of the search string.
            $filtered = array_values(array_filter($countries, static function($country) use ($search){
                return str_contains(strtolower($country->text), $search);
            }));
            $filtered = array_slice($filtered, 0, $limit);
            $data = array_map(static function($c){
                // Use provided formatted if available, otherwise generate
                $formatted = property_exists($c, 'formatted') && !empty($c->formatted)
                    ? $c->formatted
                    : (function($c){
                        $sub = $c->subtext ?? null;
                        return '<div class="w-100 rounded-2 px-2 py-1">'
                            . '<div class="fw-semibold">' . htmlspecialchars($c->text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</div>'
                            . (!empty($sub) ? '<div class="small opacity-75 mt-1">' . htmlspecialchars($sub, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</div>' : '')
                            . '</div>';
                    })($c);
                $d = [
                    'id' => $c->id,
                    'text' => $c->text,
                    'subtext' => $c->subtext ?? null,
                    'formatted' => $formatted,
                ];
                if (!empty($c->group)){
                    $d['group'] = $c->group;
                }
                return $d;
            }, $filtered);
        }



        // Put the result in the response
        $return['items'] = $data;
        $return['total'] = count($countries);
    }
    // Return as JSON
    http_response_code(200);
    exit(json_encode($return, JSON_THROW_ON_ERROR));
} catch (JsonException $e) {
    http_response_code(500);
    /** @noinspection PhpUnhandledExceptionInspection */
    exit(json_encode(['error' => $e->getMessage()], JSON_THROW_ON_ERROR));
}
