<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = new mysqli("localhost", "root", "", "hotel");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}

$sql = "SELECT ID, `Desc`, Price
        FROM parts
        WHERE ID != ''";

$result = $conn->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);

$conn->close();
?>