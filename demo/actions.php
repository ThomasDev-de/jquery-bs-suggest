<?php

$items = [];
try {
	$item = new stdClass();
	$item->text = "John Doe";
	$item->id = 1;
	$items[] = $item;
	http_response_code(200);
	header('Content-Type: application/json');
	exit(json_encode($items, JSON_THROW_ON_ERROR));
} catch (JsonException $e) {
	http_response_code(500);
	exit($e->getMessage());
}