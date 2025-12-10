import React, { useMemo, useState, useEffect } from "react";
import styles from "./AdminOrders.module.scss";
import {
  FiEye,
  FiEdit2,
  FiChevronLeft,
  FiChevronRight,
  FiTruck, // Thêm icon xe tải
  FiCheckCircle
} from "react-icons/fi";
import axios from "axios";
import { useAuth } from "../../../contexts/AuthContext"; // Import Auth
import { toast } from "react-toastify";

export default function AdminOrders() {
  const { token } = useAuth(); // Lấy token
  const [rows, setRows] = useState([]); // Khởi tạo rỗng để chứa dữ liệu thật
  const [loading, setLoading] = useState(false);

  // filters
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [method, setMethod] = useState("all");
  const [payStatus, setPayStatus] = useState("all");
  const [orderStatus, setOrderStatus] = useState("all");

  // sort + paging
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // state cho modal sửa
  const [editingOrder, setEditingOrder] = useState(null);

  const methods = ["all", "cod", "vnpay", "momo"];
  const payStatuses = ["all", "unpaid", "refund", "failed", "paid"];
  const orderStatuses = ["all", "confirmed", "shipping", "completed", "canceled"]; // Thêm shipping, completed

  // --- 1. HÀM TẢI DỮ LIỆU TỪ SERVER ---
  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      // Gọi API lấy tất cả đơn
      const { data } = await axios.get('http://localhost:5000/api/orders', config);

      // Chuyển đổi dữ liệu Backend -> Frontend UI
      const mappedOrders = data.map(order => ({
        id: order._id,
        orderCode: `#${order._id.substring(0, 6).toUpperCase()}`,
        customer: order.user?.name || "Khách vãng lai",
        receiver: order.shippingAddress.address, // Lấy địa chỉ làm người nhận
        method: order.paymentMethod.toLowerCase(), // cod, vnpay...
        // Logic map trạng thái thanh toán
        payStatus: order.isPaid ? 'paid' : 'unpaid', 
        // Logic map trạng thái đơn hàng
        orderStatus: mapBackendStatus(order.status), 
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        total: order.totalPrice,
      }));

      setRows(mappedOrders);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Helper map trạng thái Backend -> UI Class
  const mapBackendStatus = (status) => {
    if (status === 'Chờ xử lý') return 'confirmed';
    if (status === 'Đang giao hàng') return 'shipping';
    if (status === 'Đã giao hàng') return 'completed'; // Hoặc 'confirmed' nếu muốn dùng màu xanh lá
    if (status === 'Đã hủy') return 'canceled';
    return 'confirmed';
  };

  // Gọi API khi vào trang
  useEffect(() => {
    fetchOrders();
  }, [token]);

  // --- 2. HÀM XỬ LÝ GIAO HÀNG ---
  const handleDeliver = async (id) => {
    if (!window.confirm("Xác nhận đơn hàng này đã được giao thành công?")) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/orders/${id}/deliver`, {}, config);
      
      toast.success("Đã cập nhật trạng thái giao hàng!");
      fetchOrders(); // Tải lại danh sách
    } catch (error) {
      console.error(error);
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // --- LOGIC LỌC VÀ SẮP XẾP (GIỮ NGUYÊN) ---
  const filtered = useMemo(() => {
    let data = [...rows];

    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (r) =>
          r.orderCode.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.receiver.toLowerCase().includes(q)
      );
    }

    if (method !== "all") data = data.filter((r) => r.method === method);
    if (payStatus !== "all") data = data.filter((r) => r.payStatus === payStatus);
    
    // Sửa logic lọc trạng thái cho khớp với mapBackendStatus
    if (orderStatus !== "all") {
        data = data.filter((r) => r.orderStatus === orderStatus);
    }

    if (dateFrom) data = data.filter((r) => new Date(r.createdAt) >= new Date(dateFrom));
    if (dateTo) data = data.filter((r) => new Date(r.createdAt) <= new Date(dateTo));

    data.sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (sortKey === "total") {
        va = Number(va);
        vb = Number(vb);
      } else {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [rows, query, method, payStatus, orderStatus, dateFrom, dateTo, sortKey, sortDir]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(totalItems, startIdx + pageSize);
  const pageRows = filtered.slice(startIdx, endIdx);

  const badge = (t, cls) => <span className={`${styles.badge} ${styles[cls]}`}>{t}</span>;

  const methodText = (m) =>
    m === "cod" ? "Thanh toán khi nhận hàng" : m === "vnpay" ? "VN Pay" : m;

  const payText = (s) =>
    s === "unpaid" ? "Chưa thanh toán" : s === "refund" ? "Hoàn tiền" : s === "failed" ? "Thất bại" : "Đã thanh toán";

  const orderText = (s) => {
      if(s === "confirmed") return "Chờ xử lý";
      if(s === "shipping") return "Đang giao";
      if(s === "completed") return "Hoàn tất";
      if(s === "canceled") return "Đã hủy";
      return s;
  };

  const jumpTo = (e) => {
    const n = Number(e.target.value);
    if (Number.isFinite(n) && n >= 1 && n <= totalPages) setPage(n);
  };

  const handleEdit = (id) => {
    const order = rows.find((o) => o.id === id);
    if (order) setEditingOrder({ ...order });
  };

  const handleSaveEdit = () => {
    // Hiện tại chưa có API sửa thông tin chi tiết, chỉ update UI tạm thời
    if (!editingOrder) return;
    setRows((prev) =>
      prev.map((o) => (o.id === editingOrder.id ? editingOrder : o))
    );
    setEditingOrder(null);
    toast.info("Đã lưu thay đổi (Local Only - Cần API Update để lưu thật)");
  };

  return (
    <div className={styles.adminOrders}>
      <h2>Quản lý đơn hàng</h2>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Tìm theo mã, khách hàng, người nhận…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <input
          className={styles.select}
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <input
          className={styles.select}
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
        <select
          className={styles.select}
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setPage(1);
          }}
        >
          {methods.map((m) => (
            <option key={m} value={m}>
              {m === "all" ? "Phương thức thanh toán" : methodText(m)}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={payStatus}
          onChange={(e) => {
            setPayStatus(e.target.value);
            setPage(1);
          }}
        >
          {payStatuses.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Trạng thái thanh toán" : payText(s)}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={orderStatus}
          onChange={(e) => {
            setOrderStatus(e.target.value);
            setPage(1);
          }}
        >
          {orderStatuses.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Trạng thái đơn hàng" : orderText(s)}
            </option>
          ))}
        </select>

        <div className={styles.sortGroup}>
          <label>Sắp xếp:</label>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="createdAt">Ngày tạo</option>
            <option value="updatedAt">Cập nhật</option>
            <option value="total">Tổng tiền</option>
          </select>
          <button
            className={styles.dirBtn}
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          >
            {sortDir === "asc" ? "↑ Tăng" : "↓ Giảm"}
          </button>
        </div>

        <div className={styles.pageSize}>
          <span>Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>/ trang</span>
        </div>
      </div>

      {/* TABLE */}
      <div className={styles.tableWrap}>
        {loading ? (
            <div style={{padding: 20, textAlign: 'center', color: 'white'}}>Đang tải dữ liệu...</div>
        ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>STT</th>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Người nhận</th>
              <th>Phương thức</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Tổng tiền</th>
              <th style={{ width: 140, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 24, color: "#6b7280" }}>
                  Không có đơn hàng nào
                </td>
              </tr>
            ) : (
              pageRows.map((r, idx) => (
                <tr key={r.id}>
                  <td>{startIdx + idx + 1}</td>
                  <td>{r.orderCode}</td>
                  <td>{r.customer}</td>
                  <td>{r.receiver}</td>
                  <td>{methodText(r.method)}</td>
                  <td>
                    {badge(payText(r.payStatus), r.payStatus)}
                  </td>
                  <td>
                    {badge(orderText(r.orderStatus), r.orderStatus)}
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className={styles.money}>{r.total.toLocaleString("vi-VN")} đ</td>
                  <td style={{ textAlign: "right", display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                    
                    {/* NÚT GIAO HÀNG (Chỉ hiện khi chưa hoàn tất/hủy) */}
                    {r.orderStatus !== 'completed' && r.orderStatus !== 'canceled' && (
                        <button 
                            className={`${styles.iconBtn}`} 
                            style={{ color: '#10b981', borderColor: '#10b981' }}
                            title="Xác nhận giao hàng"
                            onClick={() => handleDeliver(r.id)}
                        >
                          <FiTruck />
                        </button>
                    )}

                    <button className={`${styles.iconBtn} ${styles.view}`} title="Xem">
                      <FiEye />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.edit}`}
                      title="Sửa"
                      onClick={() => handleEdit(r.id)}
                    >
                      <FiEdit2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className={styles.footer}>
        <div className={styles.rangeInfo}>
          {totalItems === 0 ? "0-0" : `${startIdx + 1}-${endIdx}`} của {totalItems} mục
        </div>

        <div className={styles.pager}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <FiChevronLeft />
          </button>
          <div className={styles.pageNow}>{page}</div>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <FiChevronRight />
          </button>

          <div className={styles.jump}>
            <span>Đến trang</span>
            <input type="number" min={1} max={totalPages} onChange={jumpTo} />
          </div>
        </div>
      </div>

      {/* MODAL EDIT ORDER (Giữ nguyên UI, chỉ update state tạm) */}
      {editingOrder && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>
              Sửa đơn hàng {editingOrder.orderCode}
            </h3>

            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Khách hàng</label>
                <input
                  type="text"
                  value={editingOrder.customer}
                  onChange={(e) =>
                    setEditingOrder((prev) => ({ ...prev, customer: e.target.value }))
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Người nhận</label>
                <input
                  type="text"
                  value={editingOrder.receiver}
                  onChange={(e) =>
                    setEditingOrder((prev) => ({ ...prev, receiver: e.target.value }))
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Phương thức thanh toán</label>
                <select
                  value={editingOrder.method}
                  onChange={(e) =>
                    setEditingOrder((prev) => ({ ...prev, method: e.target.value }))
                  }
                >
                  {methods.filter((m) => m !== "all").map((m) => (
                    <option key={m} value={m}>{methodText(m)}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Trạng thái thanh toán</label>
                <select
                  value={editingOrder.payStatus}
                  onChange={(e) =>
                    setEditingOrder((prev) => ({ ...prev, payStatus: e.target.value }))
                  }
                >
                  {payStatuses.filter((s) => s !== "all").map((s) => (
                    <option key={s} value={s}>{payText(s)}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Trạng thái đơn hàng</label>
                <select
                  value={editingOrder.orderStatus}
                  onChange={(e) =>
                    setEditingOrder((prev) => ({ ...prev, orderStatus: e.target.value }))
                  }
                >
                  {orderStatuses.filter((s) => s !== "all").map((s) => (
                    <option key={s} value={s}>{orderText(s)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setEditingOrder(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleSaveEdit}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}