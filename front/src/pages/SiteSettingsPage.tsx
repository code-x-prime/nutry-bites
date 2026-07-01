import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Globe,
  CreditCard,
  Truck,
  ImageIcon,
  Eye,
  EyeOff,
  Info,
  Wallet,
  MapPin,
  Plus,
  Trash2,
  Cloud,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { Badge } from "@/components/ui/badge";

interface SiteSettings {
  id: string;
  siteName: string;
  siteDescription: string | null;
  siteEmail: string | null;
  sitePhone: string | null;
  siteAddress: string | null;
  siteCity: string | null;
  siteState: string | null;
  sitePincode: string | null;
  siteCountry: string;
  siteGSTIN: string | null;
  sitePAN: string | null;
  siteLogo: string | null;
  siteFavicon: string | null;
  orderPrefix: string;
  orderEmailFooter: string | null;
  razorpayKeyId: string | null;
  razorpayKeySecret: string | null;
  razorpayEnabled: boolean;
  shiprocketEmail: string | null;
  shiprocketPassword: string | null;
  shiprocketEnabled: boolean;
  shiprocketToken: string | null;
  shiprocketTokenExpiry: string | null;
}

interface PickupAddress {
  id: string;
  nickname: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
  shiprocketPickupId: number | null;
}

export default function SiteSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || "general";
  const activeTab = ["general", "payment", "price", "oauth", "shipping", "branding", "media"].includes(tabParam) ? tabParam : "general";

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingShiprocket, setIsConnectingShiprocket] = useState(false);
  const [showShiprocketPassword, setShowShiprocketPassword] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [oauthForm, setOauthForm] = useState<Record<string, { isEnabled: boolean; clientId: string; clientSecret: string }>>({});

  // Payment settings (from PaymentSettings - controls checkout options)
  const [cashEnabled, setCashEnabled] = useState(true);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [phonepeEnabled, setPhonepeEnabled] = useState(false);
  const [codCharge, setCodCharge] = useState(0);

  // PhonePe gateway form
  const [phonepeForm, setPhonepeForm] = useState({
    isActive: false,
    mode: "TEST" as "TEST" | "LIVE",
    merchantId: "",
    saltKey: "",
    saltIndex: "1",
    authMethod: "V1",
    clientId: "",
    clientSecret: "",
    clientVersion: "1",
  });
  const [showPhonepeSalt, setShowPhonepeSalt] = useState(false);
  const [showPhonepeClientSecret, setShowPhonepeClientSecret] = useState(false);
  const [isSavingPhonepe, setIsSavingPhonepe] = useState(false);
  const [phonepeSavedKey, setPhonepeSavedKey] = useState(false); // flag: salt key already saved
  const [phonepeSavedClientSecret, setPhonepeSavedClientSecret] = useState(false); // flag: client secret already saved
  // Price visibility
  const [hidePricesForGuests, setHidePricesForGuests] = useState(false);
  // Shiprocket extended (pickup, dimensions, shipping charge)
  const [pickupAddresses, setPickupAddresses] = useState<PickupAddress[]>([]);
  const [defaultLength, setDefaultLength] = useState(10);
  const [defaultBreadth, setDefaultBreadth] = useState(10);
  const [defaultHeight, setDefaultHeight] = useState(10);
  const [defaultWeight, setDefaultWeight] = useState(0.5);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<PickupAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    nickname: "Primary Warehouse",
    name: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    isDefault: true,
  });

  const [form, setForm] = useState({
    siteName: "My Store",
    siteDescription: "",
    siteEmail: "",
    sitePhone: "",
    siteAddress: "",
    siteCity: "",
    siteState: "",
    sitePincode: "",
    siteCountry: "India",
    siteGSTIN: "",
    sitePAN: "",
    orderPrefix: "ORD",
    orderEmailFooter: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    razorpayEnabled: false,
    shiprocketEmail: "",
    shiprocketPassword: "",
    shiprocketEnabled: false,
  });


  const [storageForm, setStorageForm] = useState({
    activeProvider: "",
    uploadFolder: "ecom-uploads",
    spacesAccessKey: "",
    spacesSecretKey: "",
    spacesBucket: "",
    spacesRegion: "blr1",
    spacesEndpoint: "",
    spacesCdnUrl: "",
    r2AccountId: "",
    r2AccessKeyId: "",
    r2SecretAccessKey: "",
    r2BucketName: "",
    r2PublicUrl: "",
    s3AccessKeyId: "",
    s3SecretAccessKey: "",
    s3BucketName: "",
    s3Region: "",
    s3Endpoint: "",
    s3PublicUrl: "",
  });

  useEffect(() => {
    fetchSettings();
    fetchPaymentSettings();
    fetchPhonePeSettings();
    fetchPriceVisibility();
    fetchShiprocketExtended();
    fetchStorageConfig();
    fetchOAuthSettings();
  }, []);

  const fetchOAuthSettings = async () => {
    try {
      const res = await api.get("/api/admin/oauth-settings");
      if (res.data?.success && res.data?.data?.providers) {
        const providers = res.data.data.providers;
        const form: Record<string, { isEnabled: boolean; clientId: string; clientSecret: string }> = {};
        for (const p of ["google", "facebook", "twitter"]) {
          const prov = providers.find((x: { provider: string }) => x.provider === p);
          form[p] = {
            isEnabled: prov?.isEnabled ?? false,
            clientId: prov?.clientId || "",
            clientSecret: prov?.hasSecret ? "********" : "",
          };
        }
        setOauthForm(form);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveOAuth = async (provider: string) => {
    const data = oauthForm[provider];
    if (!data) return;
    try {
      setIsSaving(true);
      await api.put(`/api/admin/oauth-settings/${provider}`, {
        isEnabled: data.isEnabled,
        clientId: data.clientId || undefined,
        clientSecret: data.clientSecret !== "********" && data.clientSecret ? data.clientSecret : undefined,
      });
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth updated`);
      fetchOAuthSettings();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await api.get("/api/admin/payment-settings");
      if (res.data?.success && res.data?.data) {
        setCashEnabled(res.data.data.cashEnabled ?? true);
        setRazorpayEnabled(res.data.data.razorpayEnabled ?? false);
        setPhonepeEnabled(res.data.data.phonepeEnabled ?? false);
        setCodCharge(res.data.data.codCharge ?? 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPhonePeSettings = async () => {
    try {
      // Fetch from admin's gateway settings - find PHONEPE
      const res = await api.get("/api/admin/payment-gateway-settings/me");
      if (res.data?.success && res.data?.data) {
        const settings = res.data.data || [];
        const pp = Array.isArray(settings)
          ? settings.find((s: { gateway: string }) => s.gateway === "PHONEPE")
          : null;
        if (pp) {
          setPhonepeForm({
            isActive: pp.isActive,
            mode: pp.mode || "TEST",
            merchantId: pp.phonepeMerchantId || "",
            saltKey: pp.phonepeSaltKey || "",
            saltIndex: pp.phonepeSaltIndex || "1",
            authMethod: pp.phonepeAuthMethod || "V1",
            clientId: pp.phonepeClientId || "",
            clientSecret: pp.phonepeClientSecret || "",
            clientVersion: pp.phonepeClientVersion || "1",
          });
          setPhonepeEnabled(pp.isActive);
          setPhonepeSavedKey(!!(pp.phonepeSaltKey));
          setPhonepeSavedClientSecret(!!(pp.phonepeClientSecret));
        }
      }
    } catch (e) {
      console.error("PhonePe fetch error:", e);
    }
  };

  const fetchPriceVisibility = async () => {
    try {
      const res = await api.get("/api/admin/price-visibility-settings");
      if (res.data?.success && res.data?.data) {
        setHidePricesForGuests(res.data.data.hidePricesForGuests ?? false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStorageConfig = async () => {
    try {
      const res = await api.get("/api/admin/site-settings/storage");
      if (res.data?.success && res.data?.data?.config) {
        const c = res.data.data.config;
        setStorageForm({
          activeProvider: c.activeProvider || "",
          uploadFolder: c.uploadFolder || "ecom-uploads",
          spacesAccessKey: c.spacesAccessKey || "",
          spacesSecretKey: c.spacesSecretKey ? "********" : "",
          spacesBucket: c.spacesBucket || "",
          spacesRegion: c.spacesRegion || "blr1",
          spacesEndpoint: c.spacesEndpoint || "",
          spacesCdnUrl: c.spacesCdnUrl || "",
          r2AccountId: c.r2AccountId || "",
          r2AccessKeyId: c.r2AccessKeyId || "",
          r2SecretAccessKey: c.r2SecretAccessKey ? "********" : "",
          r2BucketName: c.r2BucketName || "",
          r2PublicUrl: c.r2PublicUrl || "",
          s3AccessKeyId: c.s3AccessKeyId || "",
          s3SecretAccessKey: c.s3SecretAccessKey ? "********" : "",
          s3BucketName: c.s3BucketName || "",
          s3Region: c.s3Region || "",
          s3Endpoint: c.s3Endpoint || "",
          s3PublicUrl: c.s3PublicUrl || "",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchShiprocketExtended = async () => {
    try {
      const [settingsRes, addressesRes] = await Promise.all([
        api.get("/api/admin/shiprocket/settings"),
        api.get("/api/admin/shiprocket/pickup-addresses"),
      ]);
      if (settingsRes.data?.success && settingsRes.data?.data?.settings) {
        const s = settingsRes.data.data.settings;
        setDefaultLength(s.defaultLength ?? 10);
        setDefaultBreadth(s.defaultBreadth ?? 10);
        setDefaultHeight(s.defaultHeight ?? 10);
        setDefaultWeight(s.defaultWeight ?? 0.5);
        setShippingCharge(parseFloat(s.shippingCharge) || 0);
        setFreeShippingThreshold(parseFloat(s.freeShippingThreshold) || 0);
      }
      if (addressesRes.data?.success && addressesRes.data?.data?.addresses) {
        setPickupAddresses(addressesRes.data.data.addresses);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/admin/site-settings");
      if (response.data?.success && response.data?.data?.settings) {
        const s = response.data.data.settings;
        setSettings(s);
        setForm({
          siteName: s.siteName || "My Store",
          siteDescription: s.siteDescription || "",
          siteEmail: s.siteEmail || "",
          sitePhone: s.sitePhone || "",
          siteAddress: s.siteAddress || "",
          siteCity: s.siteCity || "",
          siteState: s.siteState || "",
          sitePincode: s.sitePincode || "",
          siteCountry: s.siteCountry || "India",
          siteGSTIN: s.siteGSTIN || "",
          sitePAN: s.sitePAN || "",
          orderPrefix: s.orderPrefix || "ORD",
          orderEmailFooter: s.orderEmailFooter || "",
          razorpayKeyId: s.razorpayKeyId || "",
          razorpayKeySecret: s.razorpayKeySecret || "••••••••",
          razorpayEnabled: s.razorpayEnabled || false,
          shiprocketEmail: s.shiprocketEmail || "",
          shiprocketPassword: s.shiprocketPassword || "••••••••",
          shiprocketEnabled: s.shiprocketEnabled || false,
        });
      }
    } catch (err: unknown) {
      toast.error("Failed to load site settings");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    try {
      setIsSaving(true);
      await api.put("/api/admin/site-settings", {
        siteName: form.siteName,
        siteDescription: form.siteDescription || null,
        siteEmail: form.siteEmail || null,
        sitePhone: form.sitePhone || null,
        siteAddress: form.siteAddress || null,
        siteCity: form.siteCity || null,
        siteState: form.siteState || null,
        sitePincode: form.sitePincode || null,
        siteCountry: form.siteCountry,
        siteGSTIN: form.siteGSTIN || null,
        sitePAN: form.sitePAN || null,
        orderPrefix: form.orderPrefix,
        orderEmailFooter: form.orderEmailFooter || null,
      });
      toast.success("General settings saved");
      fetchSettings();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };




  const handleConnectShiprocket = async () => {
    if (!form.shiprocketEmail || !form.shiprocketPassword || form.shiprocketPassword === "••••••••") {
      toast.error("Enter email and password to connect");
      return;
    }
    try {
      setIsConnectingShiprocket(true);
      await api.post("/api/admin/site-settings/connect-shiprocket", {
        email: form.shiprocketEmail,
        password: form.shiprocketPassword,
      });
      toast.success("Shiprocket connected");
      fetchSettings();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Connection failed");
    } finally {
      setIsConnectingShiprocket(false);
    }
  };

  const handleSaveStorage = async () => {
    try {
      setIsSaving(true);
      const payload: Record<string, unknown> = {
        activeProvider: storageForm.activeProvider || null,
        uploadFolder: storageForm.uploadFolder,
        spacesAccessKey: storageForm.spacesAccessKey || null,
        spacesBucket: storageForm.spacesBucket || null,
        spacesRegion: storageForm.spacesRegion || null,
        spacesEndpoint: storageForm.spacesEndpoint || null,
        spacesCdnUrl: storageForm.spacesCdnUrl || null,
        r2AccountId: storageForm.r2AccountId || null,
        r2AccessKeyId: storageForm.r2AccessKeyId || null,
        r2BucketName: storageForm.r2BucketName || null,
        r2PublicUrl: storageForm.r2PublicUrl || null,
        s3AccessKeyId: storageForm.s3AccessKeyId || null,
        s3BucketName: storageForm.s3BucketName || null,
        s3Region: storageForm.s3Region || null,
        s3Endpoint: storageForm.s3Endpoint || null,
        s3PublicUrl: storageForm.s3PublicUrl || null,
      };
      if (storageForm.spacesSecretKey && storageForm.spacesSecretKey !== "********") payload.spacesSecretKey = storageForm.spacesSecretKey;
      if (storageForm.r2SecretAccessKey && storageForm.r2SecretAccessKey !== "********") payload.r2SecretAccessKey = storageForm.r2SecretAccessKey;
      if (storageForm.s3SecretAccessKey && storageForm.s3SecretAccessKey !== "********") payload.s3SecretAccessKey = storageForm.s3SecretAccessKey;
      await api.put("/api/admin/site-settings/storage", payload);
      toast.success("Media storage settings saved");
      fetchStorageConfig();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveShiprocket = async () => {
    try {
      setIsSaving(true);
      await api.put("/api/admin/site-settings", {
        shiprocketEmail: form.shiprocketEmail || null,
        shiprocketPassword: form.shiprocketPassword !== "••••••••" ? form.shiprocketPassword : undefined,
        shiprocketEnabled: form.shiprocketEnabled,
      });
      toast.success("Shiprocket settings saved");
      fetchSettings();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePaymentMethods = async () => {
    if (!cashEnabled && !razorpayEnabled && !phonepeEnabled) {
      toast.error("At least one payment method must be enabled (COD, PhonePe, or Razorpay)");
      return;
    }
    try {
      setIsSaving(true);
      await api.patch("/api/admin/payment-settings", {
        cashEnabled,
        razorpayEnabled,
        phonepeEnabled,
        codCharge: parseFloat(String(codCharge)) || 0,
      });
      toast.success("Payment methods saved");
      fetchPaymentSettings();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhonePe = async () => {
    if (phonepeForm.isActive) {
      if (phonepeForm.authMethod === "V2") {
        if (!phonepeForm.merchantId) {
          toast.error("Merchant ID is required when PhonePe is enabled");
          return;
        }
        if (!phonepeForm.clientId) {
          toast.error("Client ID is required");
          return;
        }
        if (!phonepeForm.clientSecret && !phonepeSavedClientSecret) {
          toast.error("Client Secret is required");
          return;
        }
      } else {
        if (!phonepeForm.merchantId || !phonepeForm.saltIndex) {
          toast.error("Merchant ID and Salt Index are required when PhonePe is enabled");
          return;
        }
        if (!phonepeForm.saltKey && !phonepeSavedKey) {
          toast.error("Salt Key is required");
          return;
        }
      }
    }
    try {
      setIsSavingPhonepe(true);
      // Get admin ID from current admin context
      const adminRes = await api.get("/api/admin/profile");
      const adminId = adminRes.data?.data?.id || adminRes.data?.data?.admin?.id;
      if (!adminId) throw new Error("Could not get admin ID");

      const payload: Record<string, unknown> = {
        gateway: "PHONEPE",
        isActive: phonepeForm.isActive,
        mode: phonepeForm.mode,
        phonepeMerchantId: phonepeForm.merchantId || null,
        phonepeAuthMethod: phonepeForm.authMethod || "V1",
        phonepeClientId: phonepeForm.authMethod === "V2" ? (phonepeForm.clientId || null) : null,
        phonepeClientVersion: phonepeForm.authMethod === "V2" ? (phonepeForm.clientVersion || null) : null,
        phonepeSaltIndex: phonepeForm.authMethod === "V1" ? (phonepeForm.saltIndex || null) : null,
      };

      // Only send saltKey if user typed something new and method is V1
      if (phonepeForm.authMethod === "V1") {
        if (phonepeForm.saltKey && phonepeForm.saltKey !== "••••••••") {
          payload.phonepeSaltKey = phonepeForm.saltKey;
        }
      } else {
        payload.phonepeSaltKey = null;
      }

      // Only send clientSecret if user typed something new and method is V2
      if (phonepeForm.authMethod === "V2") {
        if (phonepeForm.clientSecret && phonepeForm.clientSecret !== "••••••••") {
          payload.phonepeClientSecret = phonepeForm.clientSecret;
        }
      } else {
        payload.phonepeClientSecret = null;
      }

      const res = await api.post(`/api/admin/payment-gateway-settings/${adminId}`, payload);
      if (res.data?.success) {
        toast.success("PhonePe settings saved successfully!");
        setPhonepeEnabled(phonepeForm.isActive);
        fetchPhonePeSettings();
        window.dispatchEvent(new Event("paymentGatewayUpdated"));
      } else {
        toast.error(res.data?.message || "Failed to save PhonePe settings");
      }
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to save PhonePe settings");
    } finally {
      setIsSavingPhonepe(false);
    }
  };

  const handleSavePriceVisibility = async () => {
    try {
      setIsSaving(true);
      await api.patch("/api/admin/price-visibility-settings", { hidePricesForGuests });
      toast.success("Price visibility saved");
      fetchPriceVisibility();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveShiprocketExtended = async () => {
    try {
      setIsSaving(true);
      await api.put("/api/admin/shiprocket/settings", {
        defaultLength,
        defaultBreadth,
        defaultHeight,
        defaultWeight,
        shippingCharge,
        freeShippingThreshold,
      });
      toast.success("Shipping settings saved");
      fetchShiprocketExtended();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!addressForm.name || !addressForm.email || !addressForm.phone || !addressForm.address || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast.error("Fill all required fields");
      return;
    }
    try {
      setIsSaving(true);
      if (editingAddress) {
        await api.put(`/api/admin/shiprocket/pickup-addresses/${editingAddress.id}`, addressForm);
        toast.success("Address updated");
      } else {
        await api.post("/api/admin/shiprocket/pickup-addresses", addressForm);
        toast.success("Address added");
      }
      fetchShiprocketExtended();
      setIsAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm({ nickname: "Primary Warehouse", name: "", email: "", phone: "", address: "", address2: "", city: "", state: "", country: "India", pincode: "", isDefault: true });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete this pickup address?")) return;
    try {
      await api.delete(`/api/admin/shiprocket/pickup-addresses/${id}`);
      toast.success("Address deleted");
      fetchShiprocketExtended();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg || "Failed to delete");
    }
  };

  const shiprocketConnected = settings?.shiprocketToken && settings?.shiprocketTokenExpiry &&
    new Date(settings.shiprocketTokenExpiry) > new Date();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Site Settings</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Company details, payment & shipping configuration</p>
      </div>
      <div className="h-px bg-[var(--border-color)]" />

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-6">
        <TabsList className="bg-[var(--bg-secondary)] flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-[var(--bg-card)]">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-[var(--bg-card)]">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="price" className="data-[state=active]:bg-[var(--bg-card)]">
            <Eye className="h-4 w-4 mr-2" />
            Price Visibility
          </TabsTrigger>
          <TabsTrigger value="oauth" className="data-[state=active]:bg-[var(--bg-card)]">
            <LogIn className="h-4 w-4 mr-2" />
            Login (OAuth)
          </TabsTrigger>
          <TabsTrigger value="shipping" className="data-[state=active]:bg-[var(--bg-card)]">
            <Truck className="h-4 w-4 mr-2" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="branding" className="data-[state=active]:bg-[var(--bg-card)]">
            <ImageIcon className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="media" className="data-[state=active]:bg-[var(--bg-card)]">
            <Cloud className="h-4 w-4 mr-2" />
            Media Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[var(--text-primary)]">Site Name *</Label>
                <Input
                  value={form.siteName}
                  onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-[var(--text-primary)]">Site Description</Label>
                <Textarea
                  value={form.siteDescription}
                  onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[var(--text-primary)]">Site Email</Label>
                  <Input
                    type="email"
                    value={form.siteEmail}
                    onChange={(e) => setForm({ ...form, siteEmail: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[var(--text-primary)]">Site Phone</Label>
                  <Input
                    type="tel"
                    value={form.sitePhone}
                    onChange={(e) => setForm({ ...form, sitePhone: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[var(--text-primary)]">Order Prefix</Label>
                <Input
                  value={form.orderPrefix}
                  onChange={(e) => setForm({ ...form, orderPrefix: e.target.value })}
                  className="mt-1"
                  placeholder="ORD"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">Used in order IDs e.g. ORD-001</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[var(--text-primary)]">Address</Label>
                <Textarea
                  value={form.siteAddress}
                  onChange={(e) => setForm({ ...form, siteAddress: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[var(--text-primary)]">City</Label>
                  <Input value={form.siteCity} onChange={(e) => setForm({ ...form, siteCity: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-[var(--text-primary)]">State</Label>
                  <Input value={form.siteState} onChange={(e) => setForm({ ...form, siteState: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-[var(--text-primary)]">Pincode</Label>
                  <Input value={form.sitePincode} onChange={(e) => setForm({ ...form, sitePincode: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-[var(--text-primary)]">Country</Label>
                  <Input value={form.siteCountry} onChange={(e) => setForm({ ...form, siteCountry: e.target.value })} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Tax & Legal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[var(--text-primary)]">GSTIN</Label>
                <Input value={form.siteGSTIN} onChange={(e) => setForm({ ...form, siteGSTIN: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-[var(--text-primary)]">PAN Number</Label>
                <Input value={form.sitePAN} onChange={(e) => setForm({ ...form, sitePAN: e.target.value })} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Email Footer</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-[var(--text-primary)]">Order Email Footer</Label>
              <Textarea
                value={form.orderEmailFooter}
                onChange={(e) => setForm({ ...form, orderEmailFooter: e.target.value })}
                rows={4}
                className="mt-1"
                placeholder="Appears at bottom of all order emails"
              />
            </CardContent>
          </Card>

          <Button onClick={handleSaveGeneral} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save General Settings
          </Button>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          {/* Info card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-5">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-semibold">How payments work:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                    <li><strong>COD</strong> — Cash on delivery. Toggle on/off below.</li>
                    <li><strong>PhonePe</strong> — Online payments via UPI, Cards, Wallets. Enter credentials below.</li>
                    <li>Enable at least one method. PhonePe requires valid credentials to show at checkout.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* === COD Section === */}
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-600" />
                Cash on Delivery (COD)
                <Badge variant={cashEnabled ? "default" : "secondary"} className="ml-auto">
                  {cashEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </CardTitle>
              <p className="text-sm text-[var(--text-secondary)]">
                Accept payment when the order is delivered to the customer.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-lg">
                <div>
                  <Label className="text-[var(--text-primary)] font-medium">Enable COD</Label>
                  <p className="text-xs text-[var(--text-secondary)]">Show Cash on Delivery at checkout</p>
                </div>
                <Switch checked={cashEnabled} onCheckedChange={setCashEnabled} />
              </div>
              {cashEnabled && (
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg space-y-2">
                  <Label className="text-[var(--text-primary)]">COD Surcharge (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={codCharge}
                    onChange={(e) => setCodCharge(parseFloat(e.target.value) || 0)}
                    className="w-40"
                    placeholder="0"
                  />
                  <p className="text-xs text-[var(--text-secondary)]">Extra fee charged for COD orders (set 0 for no surcharge)</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSavePaymentMethods} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save COD Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* === PhonePe Section === */}
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                <svg viewBox="0 0 60 60" className="h-5 w-5" fill="none">
                  <rect width="60" height="60" rx="12" fill="#5F259F" />
                  <path d="M35.5 15h-8.4c-1.2 0-2.1 1-2.1 2.2v4.3l-5.4 1.2c-.9.2-1.6 1-1.6 2v15.1c0 1.2 1 2.2 2.2 2.2h2.1v3.2c0 1.2 1 2.2 2.2 2.2h2.1c1.2 0 2.1-1 2.1-2.2V42h7c4.8 0 8.7-3.9 8.7-8.7v-9.6C44.3 18.9 40.3 15 35.5 15z" fill="white" />
                </svg>
                PhonePe Payment Gateway
                <Badge variant={phonepeEnabled ? "default" : "secondary"} className="ml-auto">
                  {phonepeEnabled ? "Active" : "Not Configured"}
                </Badge>
              </CardTitle>
              <p className="text-sm text-[var(--text-secondary)]">
                Accept online payments via PhonePe — UPI, Credit/Debit Cards, Wallets, Net Banking.
                Credentials are stored encrypted (AES-256).
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Test credentials helper */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <p className="font-semibold mb-1">📋 Test Mode Credentials (Sandbox):</p>
                <div className="space-y-1 font-mono text-xs">
                  <p>Merchant ID: <span className="bg-amber-100 px-1 rounded select-all">PGTESTPAYUAT86</span></p>
                  <p>Salt Key: <span className="bg-amber-100 px-1 rounded select-all">96434309-7796-489d-8924-ab56988a6076</span></p>
                  <p>Salt Index: <span className="bg-amber-100 px-1 rounded select-all">1</span></p>
                </div>
                <p className="text-xs mt-1 text-amber-600">For Live credentials, visit <a href="https://developer.phonepe.com" target="_blank" className="underline">developer.phonepe.com</a></p>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-lg">
                <div>
                  <Label className="text-[var(--text-primary)] font-medium">Enable PhonePe</Label>
                  <p className="text-xs text-[var(--text-secondary)]">Show PhonePe option at checkout (requires valid credentials)</p>
                </div>
                <Switch
                  checked={phonepeForm.isActive}
                  onCheckedChange={(v) => setPhonepeForm({ ...phonepeForm, isActive: v })}
                />
              </div>

              {/* Mode */}
              <div className="space-y-1">
                <Label className="text-[var(--text-primary)]">Mode <span className="text-red-500">*</span></Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPhonepeForm({ ...phonepeForm, mode: "TEST" })}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${phonepeForm.mode === "TEST"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-blue-300"
                      }`}
                  >
                    🧪 Test Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhonepeForm({ ...phonepeForm, mode: "LIVE" })}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${phonepeForm.mode === "LIVE"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-green-300"
                      }`}
                  >
                    🚀 Live Mode
                  </button>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {phonepeForm.mode === "TEST"
                    ? "Test mode: No real money is charged. Use sandbox credentials above."
                    : "⚠️ Live mode: Real money will be charged. Use production credentials from PhonePe Business Portal."}
                </p>
              </div>

              {/* Merchant ID */}
              <div className="space-y-1">
                <Label className="text-[var(--text-primary)]">
                  Merchant ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={phonepeForm.merchantId}
                  onChange={(e) => setPhonepeForm({ ...phonepeForm, merchantId: e.target.value })}
                  placeholder={phonepeForm.mode === "TEST" ? "PGTESTPAYUAT86" : "Your PhonePe Merchant ID"}
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  From PhonePe {phonepeForm.mode === "TEST" ? "sandbox" : "production"} dashboard
                </p>
              </div>

              {/* Authentication Method Selection */}
              <div className="space-y-1">
                <Label className="text-[var(--text-primary)]">
                  Integration / Authentication Version
                </Label>
                <Select
                  value={phonepeForm.authMethod || "V1"}
                  onValueChange={(value) =>
                    setPhonepeForm({ ...phonepeForm, authMethod: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Auth Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V1">
                      V1 Standard Checkout (uses Salt Key & Salt Index)
                    </SelectItem>
                    <SelectItem value="V2">
                      V2 Standard Checkout (uses Client ID & Client Secret)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--text-secondary)]">
                  Choose between traditional Salt Key verification (V1) or OAuth Client ID Credentials flow (V2)
                </p>
              </div>

              {phonepeForm.authMethod === "V2" ? (
                <>
                  {/* Client ID */}
                  <div className="space-y-1">
                    <Label className="text-[var(--text-primary)]">
                      Client ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={phonepeForm.clientId || ""}
                      onChange={(e) =>
                        setPhonepeForm({ ...phonepeForm, clientId: e.target.value })
                      }
                      placeholder="Enter your PhonePe Client ID"
                    />
                  </div>

                  {/* Client Secret */}
                  <div className="space-y-1">
                    <Label className="text-[var(--text-primary)]">
                      Client Secret <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPhonepeClientSecret ? "text" : "password"}
                        value={phonepeForm.clientSecret || ""}
                        onChange={(e) =>
                          setPhonepeForm({ ...phonepeForm, clientSecret: e.target.value })
                        }
                        placeholder={
                          phonepeSavedClientSecret
                            ? "Leave empty to keep saved Client Secret"
                            : "Enter your PhonePe Client Secret"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPhonepeClientSecret(!showPhonepeClientSecret)}
                      >
                        {showPhonepeClientSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {phonepeSavedClientSecret && (
                      <p className="text-xs text-green-600">
                        ✓ Client Secret saved (encrypted). Enter new secret to replace.
                      </p>
                    )}
                  </div>

                  {/* Client Version */}
                  <div className="space-y-1">
                    <Label className="text-[var(--text-primary)]">
                      Client Version <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={phonepeForm.clientVersion || "1"}
                      onChange={(e) =>
                        setPhonepeForm({ ...phonepeForm, clientVersion: e.target.value })
                      }
                      placeholder="1"
                      className="w-32"
                    />
                    <p className="text-xs text-[var(--text-secondary)]">Usually "1"</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Salt Key */}
                  <div className="space-y-1">
                    <Label className="text-[var(--text-primary)]">
                      Salt Key <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPhonepeSalt ? "text" : "password"}
                        value={phonepeForm.saltKey}
                        onChange={(e) => setPhonepeForm({ ...phonepeForm, saltKey: e.target.value })}
                        placeholder={
                          phonepeSavedKey
                            ? "Leave empty to keep saved key"
                            : phonepeForm.mode === "TEST"
                              ? "96434309-7796-489d-8924-ab56988a6076"
                              : "Your PhonePe Salt Key"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPhonepeSalt(!showPhonepeSalt)}
                      >
                        {showPhonepeSalt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {phonepeSavedKey && (
                      <p className="text-xs text-green-600">✓ Salt Key is saved (encrypted). Enter new key to replace.</p>
                    )}
                    <p className="text-xs text-[var(--text-secondary)]">Stored encrypted — never shown in plain text after saving.</p>
                  </div>

                  {/* Salt Index */}
                  <div className="space-y-1">
                    <Label className="text-[var(--text-primary)]">
                      Salt Index <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={phonepeForm.saltIndex}
                      onChange={(e) => setPhonepeForm({ ...phonepeForm, saltIndex: e.target.value })}
                      placeholder="1"
                      className="w-32"
                    />
                    <p className="text-xs text-[var(--text-secondary)]">Usually "1" for both test and live mode</p>
                  </div>
                </>
              )}

              {/* Save Button */}
              <div className="flex justify-between items-center pt-4 border-t border-[var(--border-color)]">
                <Button variant="outline" onClick={() => fetchPhonePeSettings()} disabled={isSavingPhonepe}>
                  Reset
                </Button>
                <Button onClick={handleSavePhonePe} disabled={isSavingPhonepe} className="min-w-[180px]">
                  {isSavingPhonepe ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                  ) : (
                    "Save PhonePe Settings"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price" className="space-y-6">
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                <Eye className="h-5 w-5 text-[var(--accent)]" />
                Price Visibility
              </CardTitle>
              <p className="text-sm text-[var(--text-secondary)]">Control whether guests can see product prices</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-lg">
                <div>
                  <Label className="text-[var(--text-primary)] font-medium">Hide prices from guests</Label>
                  <p className="text-xs text-[var(--text-secondary)]">When enabled, only logged-in users see prices</p>
                </div>
                <Switch checked={hidePricesForGuests} onCheckedChange={setHidePricesForGuests} />
              </div>
              <Button onClick={handleSavePriceVisibility} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oauth" className="space-y-6">
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                <LogIn className="h-5 w-5 text-[var(--accent)]" />
                Social Login (OAuth)
              </CardTitle>
              <p className="text-sm text-[var(--text-secondary)]">
                By default only email/password/OTP login works. Enable Google below and add valid credentials to show the button on the auth page. Credentials are stored encrypted.
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                <strong>Google:</strong> In Google Cloud Console → APIs & Services → Credentials → Your OAuth client → Authorized redirect URIs, add: <code className="bg-amber-100 px-1 rounded block mt-1">{(import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "")}/api/auth/google/callback</code>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {["google", "facebook", "twitter"].map((provider) => {
                const data = oauthForm[provider] ?? { isEnabled: false, clientId: "", clientSecret: "" };
                return (
                  <div key={provider} className="p-4 border border-[var(--border-color)] rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[var(--text-primary)] font-medium capitalize">{provider} Login</Label>
                      <Switch
                        checked={data.isEnabled}
                        onCheckedChange={(c) =>
                          setOauthForm((prev) => ({
                            ...prev,
                            [provider]: { ...(prev[provider] ?? { isEnabled: false, clientId: "", clientSecret: "" }), isEnabled: c },
                          }))
                        }
                      />
                    </div>
                    {data.isEnabled && (
                      <>
                        <div>
                          <Label className="text-[var(--text-primary)]">Client ID</Label>
                          <Input
                            value={data.clientId}
                            onChange={(e) =>
                              setOauthForm((prev) => ({
                                ...prev,
                                [provider]: { ...(prev[provider] ?? { isEnabled: false, clientId: "", clientSecret: "" }), clientId: e.target.value },
                              }))
                            }
                            className="mt-1"
                            placeholder={provider === "google" ? "xxx.apps.googleusercontent.com" : "App ID"}
                          />
                        </div>
                        <div>
                          <Label className="text-[var(--text-primary)]">Client Secret</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showGoogleSecret ? "text" : "password"}
                              value={data.clientSecret}
                              onChange={(e) =>
                                setOauthForm((prev) => ({
                                  ...prev,
                                  [provider]: { ...(prev[provider] ?? { isEnabled: false, clientId: "", clientSecret: "" }), clientSecret: e.target.value },
                                }))
                              }
                              placeholder="Leave blank to keep existing"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              onClick={() => setShowGoogleSecret((s) => !s)}
                            >
                              {showGoogleSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Stored securely encrypted. Only valid credentials are accepted.
                          </p>
                        </div>
                        <Button onClick={() => handleSaveOAuth(provider)} disabled={isSaving || !data.clientId}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Save {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                Shiprocket Configuration
                <Badge variant={shiprocketConnected ? "default" : "destructive"}>
                  {shiprocketConnected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.shiprocketEnabled}
                  onCheckedChange={(c) => setForm({ ...form, shiprocketEnabled: c })}
                />
                <Label className="text-[var(--text-primary)]">Enable Shiprocket</Label>
              </div>
              <div>
                <Label className="text-[var(--text-primary)]">Email</Label>
                <Input
                  type="email"
                  value={form.shiprocketEmail}
                  onChange={(e) => setForm({ ...form, shiprocketEmail: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-[var(--text-primary)]">Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showShiprocketPassword ? "text" : "password"}
                    value={form.shiprocketPassword}
                    onChange={(e) => setForm({ ...form, shiprocketPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowShiprocketPassword(!showShiprocketPassword)}>
                    {showShiprocketPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConnectShiprocket} disabled={isConnectingShiprocket}>
                  {isConnectingShiprocket ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Connect
                </Button>
                <Button onClick={handleSaveShiprocket} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Credentials
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Shipping Charges & Dimensions</CardTitle>
              <p className="text-sm text-[var(--text-secondary)]">Default dimensions and shipping cost</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-[var(--text-primary)]">Length (cm)</Label>
                  <Input type="number" value={defaultLength} onChange={(e) => setDefaultLength(parseFloat(e.target.value) || 10)} />
                </div>
                <div>
                  <Label className="text-[var(--text-primary)]">Breadth (cm)</Label>
                  <Input type="number" value={defaultBreadth} onChange={(e) => setDefaultBreadth(parseFloat(e.target.value) || 10)} />
                </div>
                <div>
                  <Label className="text-[var(--text-primary)]">Height (cm)</Label>
                  <Input type="number" value={defaultHeight} onChange={(e) => setDefaultHeight(parseFloat(e.target.value) || 10)} />
                </div>
                <div>
                  <Label className="text-[var(--text-primary)]">Weight (kg)</Label>
                  <Input type="number" step="0.1" value={defaultWeight} onChange={(e) => setDefaultWeight(parseFloat(e.target.value) || 0.5)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[var(--text-primary)]">Shipping Charge (₹)</Label>
                  <Input type="number" min={0} value={shippingCharge} onChange={(e) => setShippingCharge(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-[var(--text-primary)]">Free Shipping Above (₹)</Label>
                  <Input type="number" min={0} value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)} />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Orders above this amount get free shipping</p>
                </div>
              </div>
              <Button onClick={handleSaveShiprocketExtended} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[var(--accent)]" />
                    Pickup Addresses
                  </CardTitle>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Warehouse addresses for Shiprocket</p>
                </div>
                <Dialog open={isAddressDialogOpen} onOpenChange={(o) => { setIsAddressDialogOpen(o); if (!o) { setEditingAddress(null); setAddressForm({ nickname: "Primary Warehouse", name: "", email: "", phone: "", address: "", address2: "", city: "", state: "", country: "India", pincode: "", isDefault: true }); } }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editingAddress ? "Edit" : "Add"} Pickup Address</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Nickname</Label><Input value={addressForm.nickname} onChange={(e) => setAddressForm({ ...addressForm, nickname: e.target.value })} /></div>
                        <div><Label>Contact Name *</Label><Input value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Email *</Label><Input type="email" value={addressForm.email} onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })} /></div>
                        <div><Label>Phone *</Label><Input value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} /></div>
                      </div>
                      <div><Label>Address *</Label><Input value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} /></div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><Label>City *</Label><Input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} /></div>
                        <div><Label>State *</Label><Input value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} /></div>
                        <div><Label>Pincode *</Label><Input value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} /></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={addressForm.isDefault} onCheckedChange={(c) => setAddressForm({ ...addressForm, isDefault: c })} />
                        <Label>Set as default</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAddress} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {pickupAddresses.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pickup addresses. Add one to enable Shiprocket orders.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pickupAddresses.map((addr) => (
                    <div key={addr.id} className="flex items-start justify-between p-4 border border-[var(--border-color)] rounded-lg">
                      <div>
                        <span className="font-medium text-[var(--text-primary)]">{addr.nickname}</span>
                        {addr.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{addr.name} • {addr.phone}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingAddress(addr); setAddressForm({ nickname: addr.nickname, name: addr.name, email: addr.email, phone: addr.phone, address: addr.address, address2: addr.address2 || "", city: addr.city, state: addr.state, country: addr.country, pincode: addr.pincode, isDefault: addr.isDefault }); setIsAddressDialogOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteAddress(addr.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                <Info className="h-5 w-5" />
                How Shiprocket Works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--text-secondary)] space-y-2">
              <p>When enabled:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>New orders automatically create shipments on Shiprocket</li>
                <li>Cancelled orders automatically cancel the Shiprocket shipment</li>
                <li>Return requests automatically create return orders on Shiprocket</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Logo & Favicon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--text-secondary)]">
                Logo and favicon upload can be added. Use the General tab to set siteLogo and siteFavicon URLs if you have existing assets.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Media Storage (Image Config)</CardTitle>
              <p className="text-sm text-[var(--text-secondary)]">
                All image uploads use this storage. Configure here once - products, variants, categories, attributes, banners, brands use it. Only one provider active at a time. Credentials stored securely in database.
              </p>
              <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-[var(--text-primary)]">
                <strong>Used in:</strong> Products, Variants, Categories, Subcategories, Attributes, Banners, Brands, User Profile, Blog Cover
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-[var(--text-primary)]">Active Provider</Label>
                <select
                  value={storageForm.activeProvider}
                  onChange={(e) => setStorageForm({ ...storageForm, activeProvider: e.target.value })}
                  className="mt-1 flex h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                >
                  <option value="">None (uploads disabled)</option>
                  <option value="DIGITAL_OCEAN">Digital Ocean Spaces</option>
                  <option value="CLOUDFLARE_R2">Cloudflare R2</option>
                  <option value="AWS_S3">AWS S3</option>
                </select>
              </div>
              <div>
                <Label className="text-[var(--text-primary)]">Upload Folder</Label>
                <Input
                  value={storageForm.uploadFolder}
                  onChange={(e) => setStorageForm({ ...storageForm, uploadFolder: e.target.value })}
                  placeholder="ecom-uploads"
                  className="mt-1"
                />
              </div>

              {/* Digital Ocean */}
              <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4">
                <h4 className="font-medium text-[var(--text-primary)]">Digital Ocean Spaces</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">Access Key</Label>
                    <Input value={storageForm.spacesAccessKey} onChange={(e) => setStorageForm({ ...storageForm, spacesAccessKey: e.target.value })} className="mt-1" placeholder="DO00..." />
                  </div>
                  <div>
                    <Label className="text-xs">Secret Key</Label>
                    <Input type="password" value={storageForm.spacesSecretKey} onChange={(e) => setStorageForm({ ...storageForm, spacesSecretKey: e.target.value })} className="mt-1" placeholder="Leave blank to keep" />
                  </div>
                  <div>
                    <Label className="text-xs">Bucket</Label>
                    <Input value={storageForm.spacesBucket} onChange={(e) => setStorageForm({ ...storageForm, spacesBucket: e.target.value })} className="mt-1" placeholder="my-bucket" />
                  </div>
                  <div>
                    <Label className="text-xs">Region</Label>
                    <Input value={storageForm.spacesRegion} onChange={(e) => setStorageForm({ ...storageForm, spacesRegion: e.target.value })} className="mt-1" placeholder="blr1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Endpoint</Label>
                    <Input value={storageForm.spacesEndpoint} onChange={(e) => setStorageForm({ ...storageForm, spacesEndpoint: e.target.value })} className="mt-1" placeholder="https://blr1.digitaloceanspaces.com" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">CDN URL (optional)</Label>
                    <Input value={storageForm.spacesCdnUrl} onChange={(e) => setStorageForm({ ...storageForm, spacesCdnUrl: e.target.value })} className="mt-1" placeholder="https://cdn.example.com" />
                  </div>
                </div>
              </div>

              {/* Cloudflare R2 */}
              <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4">
                <h4 className="font-medium text-[var(--text-primary)]">Cloudflare R2</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">Account ID</Label>
                    <Input value={storageForm.r2AccountId} onChange={(e) => setStorageForm({ ...storageForm, r2AccountId: e.target.value })} className="mt-1" placeholder="ab34b1de..." />
                  </div>
                  <div>
                    <Label className="text-xs">Access Key ID</Label>
                    <Input value={storageForm.r2AccessKeyId} onChange={(e) => setStorageForm({ ...storageForm, r2AccessKeyId: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Secret Access Key</Label>
                    <Input type="password" value={storageForm.r2SecretAccessKey} onChange={(e) => setStorageForm({ ...storageForm, r2SecretAccessKey: e.target.value })} className="mt-1" placeholder="Leave blank to keep" />
                  </div>
                  <div>
                    <Label className="text-xs">Bucket Name</Label>
                    <Input value={storageForm.r2BucketName} onChange={(e) => setStorageForm({ ...storageForm, r2BucketName: e.target.value })} className="mt-1" placeholder="shresthaacademy" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Public URL</Label>
                    <Input value={storageForm.r2PublicUrl} onChange={(e) => setStorageForm({ ...storageForm, r2PublicUrl: e.target.value })} className="mt-1" placeholder="https://pub-xxx.r2.dev" />
                  </div>
                </div>
              </div>

              {/* AWS S3 */}
              <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4">
                <h4 className="font-medium text-[var(--text-primary)]">AWS S3</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">Access Key ID</Label>
                    <Input value={storageForm.s3AccessKeyId} onChange={(e) => setStorageForm({ ...storageForm, s3AccessKeyId: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Secret Access Key</Label>
                    <Input type="password" value={storageForm.s3SecretAccessKey} onChange={(e) => setStorageForm({ ...storageForm, s3SecretAccessKey: e.target.value })} className="mt-1" placeholder="Leave blank to keep" />
                  </div>
                  <div>
                    <Label className="text-xs">Bucket Name</Label>
                    <Input value={storageForm.s3BucketName} onChange={(e) => setStorageForm({ ...storageForm, s3BucketName: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Region</Label>
                    <Input value={storageForm.s3Region} onChange={(e) => setStorageForm({ ...storageForm, s3Region: e.target.value })} className="mt-1" placeholder="ap-south-1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Custom Endpoint (optional)</Label>
                    <Input value={storageForm.s3Endpoint} onChange={(e) => setStorageForm({ ...storageForm, s3Endpoint: e.target.value })} className="mt-1" placeholder="https://s3.amazonaws.com" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Public URL (optional)</Label>
                    <Input value={storageForm.s3PublicUrl} onChange={(e) => setStorageForm({ ...storageForm, s3PublicUrl: e.target.value })} className="mt-1" placeholder="https://bucket.s3.region.amazonaws.com" />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveStorage} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Media Storage
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
