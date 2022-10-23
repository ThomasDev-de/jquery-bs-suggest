<?php
$countries = json_decode(file_get_contents('countries.json'));

$value = filter_input(INPUT_GET, 'value', FILTER_VALIDATE_INT);
$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) || 10;
$q = filter_input(INPUT_GET, 'q');
$search = empty($q)? false : strtolower($q);
$return = [];

$fetchSingleDate = ! empty($value);
if ($fetchSingleDate)
{
	$data = array_filter($countries, static function($country) use ($value){
		return $country->id === $value;
	});
	$return['selectedItem'] = $data[0];
}
else
{
	$data = $search === false ? [] :  array_slice(
		array:array_filter($countries, static function($country) use ($search){
			return str_contains(strtolower($country->text), $search);
		}),
		offset: 0,
		length: $limit
	);
	$return['items'] = $data;
	$return['total'] = count($countries);
}

http_response_code(200);
header('Content-Type: application/json');
try {
	exit(json_encode($return, JSON_THROW_ON_ERROR));
} catch (JsonException $e) {
	http_response_code(500);
	exit($e->getMessage());
}
