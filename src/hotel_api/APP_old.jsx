import { useEffect, useState } from "react";
import ServiceOrder from "./ServiceOrder";

export default function App() {
  return <ServiceOrder />;
}

import { useEffect, useState } from "react";

export default function App() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost/hotel_api/getItems.php")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setItems(data);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>รายการอุปกรณ์</h1>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th><th>ชื่ออุปกรณ์</th><th>ราคา</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item) => (
              <tr key={item.ID}>
                <td>{item.ID}</td>
                <td>{item.Desc}</td>
                <td>{item.Price}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="3">ไม่มีข้อมูล</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}