<?php

$bindings = [
	'time' => time(),
	'static' => 'http://' . $_SERVER['HTTP_HOST'] . '/'
];
echo preg_replace_callback("/\{\{(.+?)\}\}/i", function($data) use ($bindings) {
	return array_key_exists($data[1], $bindings) ? $bindings[$data[1]] : "";
}, file_get_contents("view/head.html"));
