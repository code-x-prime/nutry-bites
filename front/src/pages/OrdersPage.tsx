import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orders } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart,
  Search,
  Eye,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Package,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function OrdersPage() {
  const { t } = useLanguage();
  const [ordersList, setOrdersList] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const params = {
          page: currentPage,
          limit: 15,
          ...(searchQuery && { search: searchQuery }),
          ...(selectedStatus && { status: selectedStatus }),
        };
        const response = await orders.getOrders(params);
        if (response?.data?.success) {
          setOrdersList(response.data.data?.orders || []);
          setTotalPages(response.data.data?.pagination?.pages || 1);
        } else {
          setError(response.data?.message || t("orders.actions.load_error"));
        }
      } catch {
        setError(t("orders.actions.load_error"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [currentPage, searchQuery, selectedStatus, t]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PENDING:          { label: "Pending",          className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" },
    PROCESSING:       { label: "Processing",       className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
    PAID:             { label: "Paid",             className: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800" },
    SHIPPED:          { label: "Shipped",          className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800" },
    DELIVERED:        { label: "Delivered",        className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" },
    CANCELLED:        { label: "Cancelled",        className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
    REFUNDED:         { label: "Refunded",         className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800" },
    RETURN_APPROVED:  { label: "Return Approved",  className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800" },
    RETURN_COMPLETED: { label: "Return Completed", className: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800" },
  };

  const getStatus = (status: string) =>
    STATUS_CONFIG[status] ?? { label: status, className: "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)]" };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await orders.updateOrderStatus(orderId, { status: newStatus });
      if (response?.data?.success) {
        toast.success(t("orders.actions.status_update_success", { status: newStatus }));
        setOrdersList((prev: any) =>
          prev.map((o: any) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        toast.error(response.data?.message || t("orders.actions.status_update_error"));
      }
    } catch (err: any) {
      toast.error(err.message || t("orders.actions.status_update_error"));
    }
  };

  const deliveredCount  = ordersList.filter((o: any) => o.status === "DELIVERED").length;
  const pendingCount    = ordersList.filter((o: any) => o.status === "PENDING").length;
  const processingCount = ordersList.filter((o: any) => o.status === "PROCESSING").length;
  const shippedCount    = ordersList.filter((o: any) => o.status === "SHIPPED").length;

  const QUICK_FILTERS = [
    { status: "PENDING",    count: pendingCount,    label: "Pending" },
    { status: "PROCESSING", count: processingCount, label: "Processing" },
    { status: "SHIPPED",    count: shippedCount,    label: "Shipped" },
    { status: "DELIVERED",  count: deliveredCount,  label: "Delivered" },
  ];

  if (isLoading && ordersList.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm text-[var(--text-secondary)]">Loading orders…</p>
        </div>
      </div>
    );
  }

  if (error && ordersList.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="h-10 w-10 text-[var(--destructive)]" />
        <p className="text-[var(--text-secondary)]">{error}</p>
        <Button variant="outline" onClick={() => { setError(null); setCurrentPage(1); setIsLoading(true); }}>
          {t("reviews.messages.try_again")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            {t("orders.title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{t("orders.description")}</p>
        </div>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
            <ShoppingCart className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <span className="font-semibold text-[var(--text-primary)]">{ordersList.length}</span>
            <span className="text-[var(--text-secondary)]">shown</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{deliveredCount}</span>
            <span className="text-emerald-600 dark:text-emerald-500">delivered</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--border-color)]" />

      {/* Filters */}
      <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl shadow-none">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <Input
                type="search"
                placeholder="Search order number or customer…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-[var(--border-color)]"
              />
            </form>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none min-w-[160px]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Paid</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
              <option value="RETURN_APPROVED">Return Approved</option>
              <option value="RETURN_COMPLETED">Return Completed</option>
            </select>
            {(searchQuery || selectedStatus) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setSelectedStatus(""); setCurrentPage(1); }}>
                Clear
              </Button>
            )}
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map(({ status, count, label }) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(selectedStatus === status ? "" : status)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                  selectedStatus === status
                    ? STATUS_CONFIG[status]?.className
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-secondary)]"
                )}
              >
                {label}
                <span className={cn(
                  "inline-flex items-center justify-center rounded-full w-4 h-4 text-[10px] font-bold",
                  selectedStatus === status ? "bg-black/10" : "bg-[var(--border-color)]"
                )}>{count}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {ordersList.length === 0 ? (
        <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ShoppingCart className="h-10 w-10 text-[var(--text-secondary)]" />
            <p className="font-medium text-[var(--text-primary)]">{t("orders.list.no_orders")}</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {selectedStatus || searchQuery ? t("orders.list.try_adjusting") : t("orders.list.empty_desc")}
            </p>
            {(selectedStatus || searchQuery) && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedStatus(""); setSearchQuery(""); setCurrentPage(1); }}>
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl overflow-hidden shadow-none">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                <TableHead className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wide w-[140px]">
                  Order
                </TableHead>
                <TableHead className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wide">
                  Customer
                </TableHead>
                <TableHead className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wide">
                  Date
                </TableHead>
                <TableHead className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wide">
                  Items
                </TableHead>
                <TableHead className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wide">
                  AWB
                </TableHead>
                <TableHead className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wide text-right">
                  Amount
                </TableHead>
                <TableHead className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wide text-right w-[80px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-b border-[var(--border-color)]">
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-[var(--bg-secondary)] rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                ordersList.map((order: any) => {
                  const { label, className } = getStatus(order.status);
                  const itemCount = order._count?.items ?? order.items?.length ?? 0;
                  const total = order.total || order.totalAmount ||
                    (parseFloat(order.subTotal || 0) + parseFloat(order.shippingCost || 0) - parseFloat(order.discount || 0));

                  return (
                    <TableRow
                      key={order.id}
                      className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors group"
                    >
                      {/* Order number */}
                      <TableCell className="py-3">
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-mono text-sm"
                        >
                          #{order.orderNumber}
                        </Link>
                        {order.paymentMethod && (
                          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 uppercase tracking-wide">
                            {order.paymentMethod === "CASH" ? "COD" : order.paymentMethod}
                          </p>
                        )}
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="py-3">
                        <p className="font-medium text-sm text-[var(--text-primary)] truncate max-w-[160px]">
                          {order.user?.name || "Guest"}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] truncate max-w-[160px]">
                          {order.user?.email || "—"}
                        </p>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </TableCell>

                      {/* Items */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5 text-sm text-[var(--text-primary)]">
                          <Package className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        <Badge className={cn("text-xs font-medium border px-2 py-0.5 whitespace-nowrap", className)}>
                          {label}
                        </Badge>
                      </TableCell>

                      {/* AWB */}
                      <TableCell className="py-3">
                        {order.awbCode ? (
                          <a
                            href={order.trackingUrl || `https://shiprocket.co/tracking/${order.awbCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors"
                          >
                            <Truck className="h-3 w-3" />
                            {order.awbCode}
                          </a>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)]">—</span>
                        )}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-3 text-right">
                        <p className="font-bold text-sm text-[var(--text-primary)]">
                          {formatCurrency(total)}
                        </p>
                        {parseFloat(order.discount || 0) > 0 && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            -{formatCurrency(parseFloat(order.discount))} off
                          </p>
                        )}
                        {!!order.couponCode && (
                          <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                            {order.couponCode}
                          </p>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[var(--bg-secondary)]" asChild>
                            <Link to={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4 text-[var(--text-primary)]" />
                            </Link>
                          </Button>

                          {order.status !== "DELIVERED" &&
                            order.status !== "CANCELLED" &&
                            order.status !== "REFUNDED" &&
                            order.status !== "RETURN_APPROVED" &&
                            order.status !== "RETURN_COMPLETED" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[var(--bg-secondary)]">
                                    <MoreVertical className="h-4 w-4 text-[var(--text-primary)]" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[var(--bg-card)] border-[var(--border-color)] shadow-lg min-w-[160px]">
                                  {order.status !== "PROCESSING" && (
                                    <DropdownMenuItem
                                      className="text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer"
                                      onClick={() => handleStatusUpdate(order.id, "PROCESSING")}
                                    >
                                      {t("orders.actions.mark_processing")}
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "SHIPPED" && order.status !== "PENDING" && (
                                    <DropdownMenuItem
                                      className="text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer"
                                      onClick={() => handleStatusUpdate(order.id, "SHIPPED")}
                                    >
                                      {t("orders.actions.mark_shipped")}
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "DELIVERED" && (
                                    <DropdownMenuItem
                                      className="text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer"
                                      onClick={() => handleStatusUpdate(order.id, "DELIVERED")}
                                    >
                                      {t("orders.actions.mark_delivered")}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-[var(--border-color)]" />
                                  {order.status !== "CANCELLED" && (
                                    <DropdownMenuItem
                                      className="text-[var(--destructive)] hover:bg-[var(--destructive)]/10 cursor-pointer"
                                      onClick={() => handleStatusUpdate(order.id, "CANCELLED")}
                                    >
                                      {t("orders.actions.cancel")}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
              <p className="text-xs text-[var(--text-secondary)]">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 border-[var(--border-color)]"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const page = currentPage <= 3
                    ? i + 1
                    : currentPage >= totalPages - 2
                      ? totalPages - 4 + i
                      : currentPage - 2 + i;
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      className={cn("h-7 w-7 p-0 text-xs", page !== currentPage && "border-[var(--border-color)]")}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 border-[var(--border-color)]"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
