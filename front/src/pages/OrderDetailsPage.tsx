import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { orders } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, ChevronLeft, Loader2, AlertTriangle,
  Package, CreditCard, MapPin, Clock, User, Truck,
  CheckCircle, X, ExternalLink, Tag, Phone, Mail,
  Calendar, Hash, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";

/* ─── types ─────────────────────────────────────────── */
interface OrderUpdate { id: string; status: string; timestamp: string; note?: string; location?: string; description?: string; }
interface OrderItem {
  id: string; productId: string; quantity: number; price: number; subtotal: number; imageUrl?: string;
  product?: { title: string; name: string; images: string[]; imageUrl?: string };
  variant?: { sku: string; flavor?: { name: string }; weight?: { value: number; unit: string }; attributes?: Array<{ attributeValue?: { attribute?: { name?: string }; value?: string } }>; images?: Array<{ url: string }> };
  returnRequest?: { id: string; status: string; reason: string; customReason?: string; createdAt: string; processedAt?: string } | null;
}
interface OrderDetails {
  id: string; orderNumber: string; status: string; totalAmount: number;
  subTotal: string | number; shippingAmount: number; taxAmount: number;
  discount?: string | number; codCharge?: string | number;
  createdAt: string; updatedAt: string; cancelledAt?: string; cancelReason?: string; cancelledBy?: string; userId?: string;
  couponCode?: string;
  shippingAddress: { name?: string; street: string; city: string; state: string; postalCode: string; country: string; phone?: string };
  user: { name: string; email: string; phone?: string };
  items: OrderItem[]; updates?: OrderUpdate[];
  paymentGateway?: string; paymentMode?: string; paymentMethod?: string;
  razorpayPayment?: { paymentMethod: string; status: string; razorpayPaymentId?: string; razorpayOrderId?: string };
  coupon?: { discountType: string; discountValue: number; description?: string };
  tracking?: { carrier?: string; trackingNumber?: string; status?: string; estimatedDelivery?: string; updates?: OrderUpdate[] };
  shiprocket?: { orderId?: number; shipmentId?: number; awbCode?: string; courierName?: string; status?: string; trackingUrl?: string };
  shippingCost?: string | number; total?: string | number;
}
interface Courier { courierId: number; courierName: string; rate: number; estimatedDays?: string | null; etd?: string | null; codCharges: number; isRecommended: boolean; deliveryPerformance?: string | null; }

/* ─── status helpers ─────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:          { label: "Pending",          cls: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700" },
  PROCESSING:       { label: "Processing",       cls: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700" },
  PAID:             { label: "Paid",             cls: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700" },
  SHIPPED:          { label: "Shipped",          cls: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700" },
  DELIVERED:        { label: "Delivered",        cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700" },
  CANCELLED:        { label: "Cancelled",        cls: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700" },
  REFUNDED:         { label: "Refunded",         cls: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700" },
  RETURN_APPROVED:  { label: "Return Approved",  cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700" },
  RETURN_COMPLETED: { label: "Return Completed", cls: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-700" },
  APPROVED:         { label: "Approved",         cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  REJECTED:         { label: "Rejected",         cls: "bg-red-100 text-red-800 border-red-200" },
};
const getStatus = (s: string) => STATUS_CONFIG[s] ?? { label: s, cls: "bg-gray-100 text-gray-700 border-gray-200" };

const toNum = (v: string | number | undefined) => (typeof v === "string" ? parseFloat(v) : v) ?? 0;

/* ─── image helper ───────────────────────────────────── */
const imgUrl = (img: string | string[] | undefined | null): string => {
  if (!img) return "/images/product-placeholder.png";
  const src = Array.isArray(img) ? img[0] : img;
  if (typeof src !== "string") return "/images/product-placeholder.png";
  return src.startsWith("http") ? src : `https://desirediv-storage.blr1.digitaloceanspaces.com/${src}`;
};

/* ─── small field component ──────────────────────────── */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-1">{label}</p>
    <div className="text-sm font-medium text-[var(--text-primary)]">{children}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════ */
export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [couriers, setCouriers]         = useState<Courier[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [assigningCourier, setAssigningCourier]   = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]       = useState("");
  const [cancelling, setCancelling]           = useState(false);

  const fetchCouriers = useCallback(async (oid: string) => {
    setLoadingCouriers(true);
    setCouriers([]);
    setSelectedCourierId(null);
    try {
      const res = await orders.getOrderCouriers(oid);
      if (res?.data?.success) {
        const list: Courier[] = res.data.data?.couriers || [];
        setCouriers(list);
        const rec = list.find(c => c.isRecommended) || list[0];
        if (rec) setSelectedCourierId(rec.courierId);
      }
    } catch { /* silent */ }
    finally { setLoadingCouriers(false); }
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await orders.getOrderById(id);
      if (res?.data?.success && res?.data?.data?.order) {
        setOrderDetails(res.data.data.order);
      } else {
        setError(res?.data?.message || "Failed to load order");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

  useEffect(() => {
    if (orderDetails && !orderDetails.shiprocket?.awbCode && id) fetchCouriers(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderDetails?.id]);

  const fmt = (d: string) => {
    if (!d) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
  };

  const updateStatus = async (newStatus: string) => {
    if (!id) return;
    try {
      const res = await orders.updateOrderStatus(id, { status: newStatus });
      if (res?.data?.success) {
        toast.success(`Status → ${newStatus}`);
        setOrderDetails(p => p ? { ...p, status: newStatus } : p);
      } else toast.error(res?.data?.message || "Update failed");
    } catch { toast.error("Update failed"); }
  };

  const cancelOrder = async () => {
    if (!id || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      const res = await orders.updateOrderStatus(id, { status: "CANCELLED", notes: cancelReason.trim() });
      if (res?.data?.success) {
        toast.success("Order cancelled");
        setOrderDetails(p => p ? { ...p, status: "CANCELLED", cancelReason: cancelReason.trim(), cancelledBy: "ADMIN", cancelledAt: new Date().toISOString() } : p);
        setShowCancelModal(false);
        setCancelReason("");
      } else toast.error(res?.data?.message || "Cancel failed");
    } catch { toast.error("Cancel failed"); }
    finally { setCancelling(false); }
  };

  const assignCourier = async () => {
    if (!id || !selectedCourierId) return;
    setAssigningCourier(true);
    try {
      const res = await orders.assignCourierToOrder(id, selectedCourierId);
      if (res?.data?.success) { toast.success("Shipment booked!"); fetchOrderDetails(); }
      else toast.error(res?.data?.message || "Booking failed");
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Booking failed");
    } finally { setAssigningCourier(false); }
  };

  /* ── guards ── */
  if (isLoading && !orderDetails) return (
    <div className="flex h-full items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--text-secondary)]">Loading order…</p>
      </div>
    </div>
  );

  if (error && !orderDetails) return (
    <div className="flex h-full flex-col items-center justify-center py-24 gap-4">
      <AlertTriangle className="h-10 w-10 text-[var(--destructive)]" />
      <p className="text-[var(--text-secondary)]">{error}</p>
      <Button variant="outline" onClick={() => { setError(null); fetchOrderDetails(); }}>Retry</Button>
    </div>
  );

  if (!orderDetails) return null;

  const orderItems = orderDetails.items || [];
  const st = getStatus(orderDetails.status);
  const subTotal    = toNum(orderDetails.subTotal);
  const shipping    = toNum(orderDetails.shippingCost);
  const discount    = toNum(orderDetails.discount);
  const codCharge   = toNum(orderDetails.codCharge);
  const grandTotal  = toNum(orderDetails.total) || (subTotal + shipping + codCharge - discount);

  /* ── status action buttons ── */
  const canAct = !["CANCELLED","REFUNDED","RETURN_COMPLETED"].includes(orderDetails.status);

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <Link to="/orders"><ChevronLeft className="h-4 w-4 mr-1" />Back to Orders</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-mono">
              #{orderDetails.orderNumber}
            </h1>
            <Badge className={cn("text-xs font-semibold border px-3 py-1", st.cls)}>{st.label}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmt(orderDetails.createdAt)}</span>
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{orderDetails.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* action buttons */}
        {canAct && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {orderDetails.status === "PENDING" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus("PROCESSING")}>Mark Processing</Button>
            )}
            {(orderDetails.status === "PROCESSING" || orderDetails.status === "PAID") && (
              <Button size="sm" variant="outline" onClick={() => updateStatus("SHIPPED")}>Mark Shipped</Button>
            )}
            {orderDetails.status === "SHIPPED" && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus("DELIVERED")}>Mark Delivered</Button>
            )}
            {(orderDetails.status === "PENDING" || orderDetails.status === "PROCESSING") && (
              <Button size="sm" variant="outline" onClick={() => updateStatus("PAID")}>Mark Paid</Button>
            )}
            {orderDetails.status === "DELIVERED" && (
              <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50" onClick={() => updateStatus("RETURN_APPROVED")}>Approve Return</Button>
            )}
            {orderDetails.status === "RETURN_APPROVED" && (
              <Button size="sm" variant="outline" className="border-teal-400 text-teal-700 hover:bg-teal-50" onClick={() => updateStatus("RETURN_COMPLETED")}>Return Completed</Button>
            )}
            {!["DELIVERED","RETURN_APPROVED","RETURN_COMPLETED"].includes(orderDetails.status) && (
              <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setShowCancelModal(true)}>Cancel Order</Button>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-[var(--border-color)]" />

      {/* ── Status timeline ── */}
      <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl shadow-none">
        <CardContent className="px-6 py-5">
          {["CANCELLED","REFUNDED"].includes(orderDetails.status) ? (
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-600">{st.label}</p>
                {orderDetails.cancelReason && <p className="text-xs text-[var(--text-secondary)] mt-0.5">Reason: {orderDetails.cancelReason}</p>}
              </div>
            </div>
          ) : (
            (() => {
              const steps = [
                { key: "PENDING",    label: "Placed",    icon: ShoppingCart },
                { key: "PROCESSING", label: "Processing", icon: Package },
                { key: "SHIPPED",    label: "Shipped",   icon: Truck },
                { key: "DELIVERED",  label: "Delivered", icon: CheckCircle },
              ];
              const idx = steps.findIndex(s => s.key === orderDetails.status);
              const cur = idx >= 0 ? idx : (orderDetails.status === "PAID" ? 1 : 0);
              return (
                <div className="flex items-center justify-between">
                  {steps.map((step, i) => {
                    const done = i <= cur;
                    const active = i === cur;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                          {i > 0 && <div className={cn("flex-1 h-0.5 transition-colors", done ? "bg-emerald-500" : "bg-[var(--border-color)]")} />}
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mx-1 transition-colors",
                            done ? "bg-emerald-500 text-white" : active ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {i < steps.length - 1 && <div className={cn("flex-1 h-0.5", i < cur ? "bg-emerald-500" : "bg-[var(--border-color)]")} />}
                        </div>
                        <p className={cn("text-[10px] font-semibold mt-2 uppercase tracking-wide",
                          done ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--text-secondary)]"
                        )}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>

      {/* ── Main grid: 2 cols ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT — items + shiprocket ── lg:col-span-3 */}
        <div className="lg:col-span-3 space-y-6">

          {/* Order items */}
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl shadow-none">
            <CardHeader className="px-6 pt-5 pb-3 border-b border-[var(--border-color)]">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Package className="h-4 w-4 text-[var(--accent)]" />
                Order Items
                <span className="ml-auto text-xs font-normal text-[var(--text-secondary)]">{orderItems.length} item{orderItems.length !== 1 ? "s" : ""}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 divide-y divide-[var(--border-color)]">
              {orderItems.map((item) => {
                const attrs = (item.variant?.attributes ?? [])
                  .map(a => a.attributeValue?.attribute?.name && a.attributeValue.value
                    ? `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`
                    : null)
                  .filter(Boolean).join(" • ");

                return (
                  <div key={item.id} className="py-4 flex gap-4">
                    {/* image */}
                    <div className="h-20 w-20 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden flex-shrink-0">
                      <img
                        src={imgUrl(item.imageUrl || item.product?.imageUrl || (Array.isArray(item.product?.images) ? item.product!.images[0] : null) || item.variant?.images?.[0]?.url)}
                        alt={item.product?.name || "Product"}
                        className="h-full w-full object-contain p-1"
                        onError={e => { e.currentTarget.src = "/images/product-placeholder.png"; }}
                      />
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] text-sm leading-tight">
                        {item.product?.name || item.product?.title || "Product"}
                      </p>
                      {item.variant?.sku && (
                        <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">SKU: {item.variant.sku}</p>
                      )}
                      {attrs && <p className="text-xs text-[var(--text-secondary)] mt-1">{attrs}</p>}
                      {item.returnRequest && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
                          <RotateCcw className="h-2.5 w-2.5" />
                          Return: {item.returnRequest.status}
                          {item.returnRequest.reason && ` — ${item.returnRequest.reason}`}
                        </div>
                      )}
                    </div>

                    {/* pricing */}
                    <div className="text-right flex-shrink-0 space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">{formatCurrency(item.price)} × {item.quantity}</p>
                      <p className="font-bold text-[var(--text-primary)] text-base">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                );
              })}

              {/* totals */}
              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Subtotal</span><span className="text-[var(--text-primary)] font-medium">{formatCurrency(subTotal)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                    <span>Shipping</span><span className="text-[var(--text-primary)] font-medium">{formatCurrency(shipping)}</span>
                  </div>
                )}
                {codCharge > 0 && (
                  <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                    <span>COD Surcharge</span><span className="text-[var(--text-primary)] font-medium">{formatCurrency(codCharge)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Discount</span>
                    <span className="text-emerald-600 font-medium">−{formatCurrency(discount)}</span>
                  </div>
                )}
                {orderDetails.couponCode && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 mt-1">
                    <Tag className="h-3 w-3" />
                    Coupon <span className="font-mono font-bold">{orderDetails.couponCode}</span>
                    {orderDetails.coupon && (
                      <span className="ml-1 opacity-70">
                        ({orderDetails.coupon.discountType === "PERCENTAGE" ? `${orderDetails.coupon.discountValue}%` : formatCurrency(orderDetails.coupon.discountValue)} off)
                      </span>
                    )}
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-[var(--border-color)] pt-3 mt-2">
                  <span className="text-[var(--text-primary)]">Total</span>
                  <span className="text-[var(--text-primary)]">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shiprocket */}
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl shadow-none overflow-hidden">
            <CardHeader className="px-6 pt-5 pb-3 border-b border-[var(--border-color)]">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  Shiprocket Shipment
                </span>
                {orderDetails.shiprocket?.awbCode && (
                  <Badge className="text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700">
                    {orderDetails.shiprocket.status || "AWB Assigned"}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {orderDetails.shiprocket?.awbCode ? (
                <div className="space-y-4">
                  {/* AWB hero */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">AWB / Tracking Number</p>
                    <p className="font-mono font-black text-3xl text-[var(--text-primary)] tracking-widest leading-none">{orderDetails.shiprocket.awbCode}</p>
                    {orderDetails.shiprocket.trackingUrl && (
                      <Button size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        onClick={() => window.open(orderDetails.shiprocket!.trackingUrl!, "_blank")}>
                        <ExternalLink className="h-3.5 w-3.5" />Track Live on Shiprocket
                      </Button>
                    )}
                  </div>

                  {/* IDs grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {orderDetails.shiprocket.orderId && (
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-1">SR Order ID</p>
                        <p className="font-mono font-bold text-xl text-[var(--text-primary)]">{orderDetails.shiprocket.orderId}</p>
                      </div>
                    )}
                    {orderDetails.shiprocket.shipmentId && (
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-1">Shipment ID</p>
                        <p className="font-mono font-bold text-xl text-[var(--text-primary)]">{orderDetails.shiprocket.shipmentId}</p>
                      </div>
                    )}
                    {orderDetails.shiprocket.courierName && (
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-1">Courier Partner</p>
                        <p className="font-bold text-base text-[var(--text-primary)]">{orderDetails.shiprocket.courierName}</p>
                      </div>
                    )}
                    {orderDetails.shiprocket.status && (
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-1">SR Status</p>
                        <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">{orderDetails.shiprocket.status}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Select Courier</p>
                    <button type="button" onClick={() => fetchCouriers(id!)} disabled={loadingCouriers}
                      className="text-xs text-[var(--accent)] hover:underline disabled:opacity-40">
                      {loadingCouriers ? "Loading…" : "Refresh"}
                    </button>
                  </div>

                  {couriers.length === 0 && !loadingCouriers && (
                    <button type="button" onClick={() => fetchCouriers(id!)}
                      className="w-full text-sm text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-xl py-4 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                      <Truck className="inline mr-2 h-4 w-4" />Load Available Couriers
                    </button>
                  )}

                  {loadingCouriers && (
                    <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] py-5">
                      <Loader2 className="h-4 w-4 animate-spin" />Fetching couriers…
                    </div>
                  )}

                  {couriers.length > 0 && (
                    <div className="space-y-2">
                      {couriers.map(c => (
                        <div key={c.courierId} onClick={() => setSelectedCourierId(c.courierId)}
                          className={cn("flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition-all",
                            selectedCourierId === c.courierId
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                              : "border-[var(--border-color)] hover:border-emerald-400")}>
                          <div className="flex items-center gap-3">
                            <input type="radio" checked={selectedCourierId === c.courierId}
                              onChange={e => { e.stopPropagation(); setSelectedCourierId(c.courierId); }}
                              onClick={e => e.stopPropagation()}
                              className="h-4 w-4 accent-emerald-600" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-[var(--text-primary)]">{c.courierName}</p>
                                {c.isRecommended && <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">REC</span>}
                              </div>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                ETD: {c.etd ?? c.estimatedDays ?? "—"}
                                {c.codCharges > 0 && orderDetails.paymentMethod === "CASH" && <span className="ml-2 text-amber-600">+₹{c.codCharges} COD</span>}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-base text-[var(--text-primary)]">{c.rate === 0 ? "FREE" : `₹${c.rate}`}</p>
                        </div>
                      ))}
                      <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                        disabled={!selectedCourierId || assigningCourier} onClick={assignCourier}>
                        {assigningCourier ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Booking…</> : "Book Shipment"}
                      </Button>
                    </div>
                  )}

                  {orderDetails.shiprocket?.orderId && !orderDetails.shiprocket?.awbCode && (
                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                      SR Order created (ID: {orderDetails.shiprocket.orderId}) — AWB not yet assigned.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking updates (if shipped/delivered) */}
          {(orderDetails.status === "SHIPPED" || orderDetails.status === "DELIVERED") && orderDetails.tracking?.updates && orderDetails.tracking.updates.length > 0 && (
            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl shadow-none">
              <CardHeader className="px-6 pt-5 pb-3 border-b border-[var(--border-color)]">
                <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--accent)]" />Tracking History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <div className="relative pl-5 space-y-0">
                  {orderDetails.tracking.updates.map((u, i) => (
                    <div key={i} className="relative pb-4 last:pb-0">
                      {i < orderDetails.tracking!.updates!.length - 1 && <div className="absolute left-[-14px] top-3 bottom-0 w-0.5 bg-[var(--border-color)]" />}
                      <div className={cn("absolute left-[-18px] top-1.5 w-3 h-3 rounded-full border-2", i === 0 ? "bg-[var(--accent)] border-[var(--accent)]" : "bg-[var(--bg-card)] border-[var(--border-color)]")} />
                      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] px-4 py-3">
                        <p className="font-semibold text-sm text-[var(--text-primary)]">{u.status}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{fmt(u.timestamp)}{u.location && ` • ${u.location}`}</p>
                        {u.description && <p className="text-xs text-[var(--text-secondary)] mt-1">{u.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT — sidebar ── lg:col-span-2 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Customer */}
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl shadow-none">
            <CardHeader className="px-5 pt-5 pb-3 border-b border-[var(--border-color)]">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--accent)]" />Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-3">
              <p className="font-bold text-base text-[var(--text-primary)]">{orderDetails.user?.name || "Guest"}</p>
              {orderDetails.user?.email && (
                <a href={`mailto:${orderDetails.user.email}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  <Mail className="h-3.5 w-3.5" />{orderDetails.user.email}
                </a>
              )}
              {orderDetails.user?.phone && (
                <a href={`tel:${orderDetails.user.phone}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  <Phone className="h-3.5 w-3.5" />{orderDetails.user.phone}
                </a>
              )}
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl shadow-none">
            <CardHeader className="px-5 pt-5 pb-3 border-b border-[var(--border-color)]">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--accent)]" />Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
              {orderDetails.shippingAddress ? (
                <address className="not-italic space-y-0.5 text-sm text-[var(--text-primary)] leading-relaxed">
                  <p className="font-bold">{orderDetails.shippingAddress.name}</p>
                  <p>{orderDetails.shippingAddress.street}</p>
                  <p>{orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.postalCode}</p>
                  <p>{orderDetails.shippingAddress.country}</p>
                  {orderDetails.shippingAddress.phone && (
                    <p className="flex items-center gap-1.5 mt-2 text-[var(--text-secondary)]">
                      <Phone className="h-3 w-3" />{orderDetails.shippingAddress.phone}
                    </p>
                  )}
                </address>
              ) : <p className="text-sm text-[var(--text-secondary)]">No address</p>}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl shadow-none">
            <CardHeader className="px-5 pt-5 pb-3 border-b border-[var(--border-color)]">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[var(--accent)]" />Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <Field label="Method">{orderDetails.paymentMethod || orderDetails.razorpayPayment?.paymentMethod || "ONLINE"}</Field>
                <Badge className={cn("text-xs font-semibold border",
                  orderDetails.razorpayPayment?.status === "CAPTURED" || orderDetails.razorpayPayment?.status === "PAID" || orderDetails.status === "PAID"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700"
                    : "bg-amber-100 text-amber-800 border-amber-200"
                )}>
                  {orderDetails.razorpayPayment?.status || orderDetails.status}
                </Badge>
              </div>
              {orderDetails.paymentGateway && (
                <Field label="Gateway">{orderDetails.paymentGateway}{orderDetails.paymentMode && <span className="text-[var(--text-secondary)] ml-1">({orderDetails.paymentMode})</span>}</Field>
              )}
              {orderDetails.razorpayPayment?.razorpayPaymentId && (
                <Field label="Payment ID">
                  <span className="font-mono text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] px-2 py-1 rounded inline-block">
                    {orderDetails.razorpayPayment.razorpayPaymentId}
                  </span>
                </Field>
              )}
              {orderDetails.razorpayPayment?.razorpayOrderId && (
                <Field label="Razorpay Order ID">
                  <span className="font-mono text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] px-2 py-1 rounded inline-block">
                    {orderDetails.razorpayPayment.razorpayOrderId}
                  </span>
                </Field>
              )}
            </CardContent>
          </Card>

          {/* Cancellation info */}
          {orderDetails.status === "CANCELLED" && (
            <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 rounded-xl shadow-none">
              <CardHeader className="px-5 pt-5 pb-3 border-b border-red-200 dark:border-red-800">
                <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />Cancellation
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-4 space-y-3">
                {orderDetails.cancelledAt && <Field label="Cancelled At">{fmt(orderDetails.cancelledAt)}</Field>}
                <Field label="Reason">{orderDetails.cancelReason || "No reason provided"}</Field>
                <Field label="Cancelled By">{orderDetails.cancelledBy === orderDetails.userId ? "Customer" : "Admin"}</Field>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* ── Cancel modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />Cancel Order
              </h3>
              <button onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Cancelling <span className="font-bold text-[var(--text-primary)]">#{orderDetails.orderNumber}</span>. Cannot be undone.
            </p>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation…" rows={3}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 mb-4" />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowCancelModal(false); setCancelReason(""); }} disabled={cancelling}>Keep Order</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={cancelOrder}
                disabled={cancelling || !cancelReason.trim()}>
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
