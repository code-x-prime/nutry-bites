import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    Smartphone,
    Info,
    Eye,
    EyeOff,
    ExternalLink,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

interface PaymentGatewaySetting {
    id: string;
    gateway: "RAZORPAY" | "PHONEPE";
    isActive: boolean;
    mode: "TEST" | "LIVE";
    phonepeMerchantId?: string | null;
    phonepeSaltKey?: string | null;
    phonepeSaltIndex?: string | null;
    phonepeAuthMethod?: string | null;
    phonepeClientId?: string | null;
    phonepeClientSecret?: string | null;
    phonepeClientVersion?: string | null;
}

export default function PaymentGatewaySettingsPage() {
    const { admin } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [phonepeSettings, setPhonepeSettings] = useState<PaymentGatewaySetting | null>(null);

    // PhonePe form state
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

    // Show/hide secrets
    const [showPhonepeSalt, setShowPhonepeSalt] = useState(false);
    const [showPhonepeClientSecret, setShowPhonepeClientSecret] = useState(false);

    useEffect(() => {
        if (admin) fetchSettings();
    }, [admin]);

    const fetchSettings = async () => {
        if (!admin) return;
        try {
            setIsLoading(true);
            const response = await api.get(`/api/admin/payment-gateway-settings/${admin.id}`);
            if (response.data.success) {
                const settings = response.data.data || [];
                const phonepe = settings.find((s: PaymentGatewaySetting) => s.gateway === "PHONEPE");
                if (phonepe) {
                    setPhonepeSettings(phonepe);
                    setPhonepeForm({
                        isActive: phonepe.isActive,
                        mode: phonepe.mode,
                        merchantId: phonepe.phonepeMerchantId || "",
                        saltKey: phonepe.phonepeSaltKey || "",
                        saltIndex: phonepe.phonepeSaltIndex || "1",
                        authMethod: phonepe.phonepeAuthMethod || "V1",
                        clientId: phonepe.phonepeClientId || "",
                        clientSecret: phonepe.phonepeClientSecret || "",
                        clientVersion: phonepe.phonepeClientVersion || "1",
                    });
                }
            }
        } catch (error: unknown) {
            console.error("Error fetching payment gateway settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePhonepe = async () => {
        if (!admin) return;
        if (phonepeForm.isActive) {
            if (phonepeForm.authMethod === "V2") {
                if (!phonepeForm.merchantId || !phonepeForm.clientId || !phonepeForm.clientSecret) {
                    toast.error("Merchant ID, Client ID, and Client Secret are required when PhonePe is enabled in V2 Mode");
                    return;
                }
            } else {
                if (!phonepeForm.merchantId || !phonepeForm.saltKey || !phonepeForm.saltIndex) {
                    toast.error("Merchant ID, Salt Key, and Salt Index are required when PhonePe is enabled in V1 Mode");
                    return;
                }
            }
        }
        try {
            setIsSaving(true);
            const response = await api.post(
                `/api/admin/payment-gateway-settings/${admin.id}`,
                {
                    gateway: "PHONEPE",
                    isActive: phonepeForm.isActive,
                    mode: phonepeForm.mode,
                    phonepeMerchantId: phonepeForm.merchantId || null,
                    phonepeSaltKey: phonepeForm.saltKey || null,
                    phonepeSaltIndex: phonepeForm.saltIndex || null,
                    phonepeAuthMethod: phonepeForm.authMethod || "V1",
                    phonepeClientId: phonepeForm.clientId || null,
                    phonepeClientSecret: phonepeForm.clientSecret || null,
                    phonepeClientVersion: phonepeForm.clientVersion || null,
                }
            );
            if (response.data.success) {
                toast.success("PhonePe settings saved successfully!");
                fetchSettings();
                window.dispatchEvent(new Event("paymentGatewayUpdated"));
            } else {
                toast.error(response.data.message || "Failed to save PhonePe settings");
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to save PhonePe settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isConfigured = phonepeSettings?.phonepeMerchantId && phonepeSettings?.phonepeSaltKey;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
                    Payment Gateway Settings
                </h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1.5">
                    Configure PhonePe payment gateway for online payments. Keys are stored encrypted in the database.
                </p>
            </div>

            {/* Status Overview */}
            <div className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                {phonepeSettings?.isActive && isConfigured ? (
                    <>
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">PhonePe is Active</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                Mode: <Badge variant={phonepeSettings.mode === "LIVE" ? "default" : "secondary"}>{phonepeSettings.mode}</Badge>
                                {" · "}Merchant ID: {phonepeSettings.phonepeMerchantId}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <XCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">PhonePe is Not Configured</p>
                            <p className="text-xs text-[var(--text-secondary)]">Enter credentials below and enable to accept online payments.</p>
                        </div>
                    </>
                )}
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-blue-800">Where to get PhonePe credentials?</p>
                            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                <li>
                                    <strong>Test Mode:</strong> Use sandbox credentials from PhonePe Developer Portal
                                    <br />
                                    <span className="ml-4 font-mono text-xs bg-blue-100 px-1 rounded">Merchant ID: PGTESTPAYUAT86</span>
                                    <span className="ml-2 font-mono text-xs bg-blue-100 px-1 rounded">Salt Key: 96434309-7796-489d-8924-ab56988a6076</span>
                                    <span className="ml-2 font-mono text-xs bg-blue-100 px-1 rounded">Salt Index: 1</span>
                                </li>
                                <li>
                                    <strong>Live Mode:</strong> Apply at PhonePe Business Portal for production credentials
                                </li>
                                <li>Keys are <strong>encrypted</strong> before storing in database (AES-256)</li>
                                <li>Change mode between TEST and LIVE as needed — each has separate keys</li>
                            </ul>
                            <a
                                href="https://developer.phonepe.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline mt-1"
                            >
                                PhonePe Developer Portal <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* PhonePe Settings */}
            <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                        <Smartphone className="h-5 w-5 text-purple-600" />
                        PhonePe Payment Gateway
                        <Badge variant={phonepeForm.isActive ? "default" : "secondary"} className="ml-auto">
                            {phonepeForm.isActive ? "Enabled" : "Disabled"}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Accept payments via PhonePe — UPI, Cards, Wallets, Net Banking.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)]">
                        <div className="space-y-0.5">
                            <Label htmlFor="phonepe-enabled" className="text-base font-medium text-[var(--text-primary)]">
                                Enable PhonePe
                            </Label>
                            <p className="text-sm text-[var(--text-secondary)]">
                                When enabled, PhonePe payment option appears at checkout
                            </p>
                        </div>
                        <Switch
                            id="phonepe-enabled"
                            checked={phonepeForm.isActive}
                            onCheckedChange={(checked) =>
                                setPhonepeForm({ ...phonepeForm, isActive: checked })
                            }
                        />
                    </div>

                    {/* Mode Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="phonepe-mode" className="text-[var(--text-primary)]">
                            Payment Mode <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={phonepeForm.mode}
                            onValueChange={(value: "TEST" | "LIVE") =>
                                setPhonepeForm({ ...phonepeForm, mode: value })
                            }
                        >
                            <SelectTrigger id="phonepe-mode">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TEST">
                                    🧪 Test Mode — Use sandbox credentials
                                </SelectItem>
                                <SelectItem value="LIVE">
                                    🚀 Live Mode — Use production credentials
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {phonepeForm.mode === "TEST"
                                ? "Test mode: No real money is charged. Use test credentials shown above."
                                : "⚠️ Live mode: Real money will be charged. Use your production credentials only."}
                        </p>
                    </div>

                    {/* Merchant ID */}
                    <div className="space-y-2">
                        <Label htmlFor="phonepe-merchant-id" className="text-[var(--text-primary)]">
                            Merchant ID <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="phonepe-merchant-id"
                            value={phonepeForm.merchantId}
                            onChange={(e) =>
                                setPhonepeForm({ ...phonepeForm, merchantId: e.target.value })
                            }
                            placeholder={phonepeForm.mode === "TEST" ? "PGTESTPAYUAT86" : "Enter your PhonePe Merchant ID"}
                        />
                        <p className="text-xs text-[var(--text-secondary)]">
                    </div>

                    {/* Authentication Method Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="phonepe-auth-method" className="text-[var(--text-primary)]">
                            Integration / Authentication Version
                        </Label>
                        <Select
                            value={phonepeForm.authMethod}
                            onValueChange={(value) =>
                                setPhonepeForm({ ...phonepeForm, authMethod: value })
                            }
                        >
                            <SelectTrigger id="phonepe-auth-method">
                                <SelectValue />
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
                            <div className="space-y-2">
                                <Label htmlFor="phonepe-client-id" className="text-[var(--text-primary)]">
                                    Client ID <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phonepe-client-id"
                                    value={phonepeForm.clientId}
                                    onChange={(e) =>
                                        setPhonepeForm({ ...phonepeForm, clientId: e.target.value })
                                    }
                                    placeholder="Enter your PhonePe Client ID"
                                />
                            </div>

                            {/* Client Secret */}
                            <div className="space-y-2">
                                <Label htmlFor="phonepe-client-secret" className="text-[var(--text-primary)]">
                                    Client Secret <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="phonepe-client-secret"
                                        type={showPhonepeClientSecret ? "text" : "password"}
                                        value={phonepeForm.clientSecret}
                                        onChange={(e) =>
                                            setPhonepeForm({ ...phonepeForm, clientSecret: e.target.value })
                                        }
                                        placeholder={
                                            phonepeSettings?.phonepeClientSecret
                                                ? "Leave empty to keep existing client secret"
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
                                {phonepeSettings?.phonepeClientSecret && (
                                    <p className="text-xs text-green-600">
                                        ✓ Client Secret saved (encrypted). Leave empty to keep existing.
                                    </p>
                                )}
                            </div>

                            {/* Client Version */}
                            <div className="space-y-2">
                                <Label htmlFor="phonepe-client-version" className="text-[var(--text-primary)]">
                                    Client Version <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phonepe-client-version"
                                    value={phonepeForm.clientVersion}
                                    onChange={(e) =>
                                        setPhonepeForm({ ...phonepeForm, clientVersion: e.target.value })
                                    }
                                    placeholder="1"
                                    className="w-32"
                                />
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Usually "1"
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Salt Key */}
                            <div className="space-y-2">
                                <Label htmlFor="phonepe-salt-key" className="text-[var(--text-primary)]">
                                    Salt Key <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="phonepe-salt-key"
                                        type={showPhonepeSalt ? "text" : "password"}
                                        value={phonepeForm.saltKey}
                                        onChange={(e) =>
                                            setPhonepeForm({ ...phonepeForm, saltKey: e.target.value })
                                        }
                                        placeholder={
                                            phonepeSettings?.phonepeSaltKey
                                                ? "Leave empty to keep existing key"
                                                : phonepeForm.mode === "TEST"
                                                ? "96434309-7796-489d-8924-ab56988a6076"
                                                : "Enter your PhonePe Salt Key"
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full"
                                        onClick={() => setShowPhonepeSalt(!showPhonepeSalt)}
                                    >
                                        {showPhonepeSalt ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {phonepeSettings?.phonepeSaltKey && (
                                    <p className="text-xs text-green-600">
                                        ✓ Salt Key saved (encrypted). Leave empty to keep existing.
                                    </p>
                                )}
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Stored encrypted in database. Never exposed in plain text.
                                </p>
                            </div>

                            {/* Salt Index */}
                            <div className="space-y-2">
                                <Label htmlFor="phonepe-salt-index" className="text-[var(--text-primary)]">
                                    Salt Index <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phonepe-salt-index"
                                    value={phonepeForm.saltIndex}
                                    onChange={(e) =>
                                        setPhonepeForm({ ...phonepeForm, saltIndex: e.target.value })
                                    }
                                    placeholder="1"
                                    className="w-32"
                                />
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Usually "1" for both test and live mode
                                </p>
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-[var(--border-color)]">
                        <Button
                            variant="outline"
                            onClick={() => fetchSettings()}
                            disabled={isSaving}
                        >
                            Reset
                        </Button>
                        <Button
                            onClick={handleSavePhonepe}
                            disabled={isSaving}
                            className="min-w-[160px]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save PhonePe Settings"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800 space-y-1">
                            <p className="font-semibold">How PhonePe checkout works:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Customer selects "PhonePe" at checkout</li>
                                <li>System creates a payment request and redirects to PhonePe</li>
                                <li>Customer completes payment on PhonePe page</li>
                                <li>PhonePe redirects back — order is automatically created</li>
                                <li>Confirmation email sent + Shiprocket order created</li>
                            </ol>
                            <p className="mt-2 text-xs">
                                Callback URL (auto-configured): <code className="bg-amber-100 px-1 rounded">/api/payment/phonepe/verify</code>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
