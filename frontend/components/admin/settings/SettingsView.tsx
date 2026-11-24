"use client";

import { useEffect, useState, type FormEvent } from "react";
import { OpeningHoursEditor } from "@/components/admin/settings/OpeningHoursEditor";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Controls";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { fractionDigits, minorToInput, parseMoneyInput } from "@/lib/admin-money";
import { errorMessage, fieldErrors } from "@/lib/api-fields";
import { adminText } from "@/messages/admin";
import { getSettings, updateSettings } from "@/services/admin";
import type { AdminSettings, OpeningHour } from "@/types/admin";

/** The form keeps every value as text while it is being edited, then converts when saving. */
interface FormValues {
  restaurantName: string;
  contactPhone: string;
  contactAddress: string;
  hoursText: string;
  timezone: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFee: string;
  deliveryNote: string;
  minimumOrder: string;
  currency: string;
  locale: string;
  estimateText: string;
  maxQuantityPerLine: string;
  maxItemsPerOrder: string;
  defaultPhoneCountry: string;
  orderNumberPrefix: string;
  enforceOpeningHours: boolean;
  openingHours: OpeningHour[];
}

function toForm(settings: AdminSettings): FormValues {
  const digits = fractionDigits(settings.currency, settings.locale);
  return {
    restaurantName: settings.restaurantName,
    contactPhone: settings.contactPhone,
    contactAddress: settings.contactAddress,
    hoursText: settings.hoursText,
    timezone: settings.timezone,
    pickupEnabled: settings.pickupEnabled,
    deliveryEnabled: settings.deliveryEnabled,
    deliveryFee: minorToInput(settings.deliveryFeeMinor, digits),
    deliveryNote: settings.deliveryNote,
    minimumOrder: settings.minimumOrderMinor === null ? "" : minorToInput(settings.minimumOrderMinor, digits),
    currency: settings.currency,
    locale: settings.locale,
    estimateText: settings.estimateText,
    maxQuantityPerLine: String(settings.maxQuantityPerLine),
    maxItemsPerOrder: String(settings.maxItemsPerOrder),
    defaultPhoneCountry: settings.defaultPhoneCountry,
    orderNumberPrefix: settings.orderNumberPrefix,
    enforceOpeningHours: settings.enforceOpeningHours,
    openingHours: settings.openingHours,
  };
}

function SettingsForm({ initial }: { initial: AdminSettings }) {
  const [values, setValues] = useState<FormValues>(() => toForm(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  };
  const text = (key: keyof FormValues & string) => ({
    value: values[key] as string,
    error: errors[key],
    onChange: (event: { target: { value: string } }) => set(key, event.target.value as never),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const currency = values.currency.trim().toUpperCase();
    const digits = fractionDigits(currency.length === 3 ? currency : initial.currency, values.locale);
    const problems: Record<string, string> = {};

    const deliveryFeeMinor = parseMoneyInput(values.deliveryFee || "0", digits);
    if (deliveryFeeMinor === null) problems.deliveryFeeMinor = adminText.menu.priceInvalid;
    let minimumOrderMinor: number | null = null;
    if (values.minimumOrder.trim() !== "") {
      minimumOrderMinor = parseMoneyInput(values.minimumOrder, digits);
      if (minimumOrderMinor === null) problems.minimumOrderMinor = adminText.menu.priceInvalid;
    }
    const maxQuantityPerLine = Number(values.maxQuantityPerLine);
    const maxItemsPerOrder = Number(values.maxItemsPerOrder);
    if (!Number.isInteger(maxQuantityPerLine)) problems.maxQuantityPerLine = adminText.settings.wholeNumber;
    if (!Number.isInteger(maxItemsPerOrder)) problems.maxItemsPerOrder = adminText.settings.wholeNumber;

    setErrors(problems);
    setFormError(null);
    if (Object.keys(problems).length > 0 || deliveryFeeMinor === null) return;

    setSaving(true);
    try {
      const updated = await updateSettings({
        restaurantName: values.restaurantName.trim(),
        contactPhone: values.contactPhone.trim(),
        contactAddress: values.contactAddress.trim(),
        hoursText: values.hoursText.trim(),
        timezone: values.timezone.trim(),
        pickupEnabled: values.pickupEnabled,
        deliveryEnabled: values.deliveryEnabled,
        deliveryFeeMinor,
        deliveryNote: values.deliveryNote.trim(),
        minimumOrderMinor,
        currency,
        locale: values.locale.trim(),
        estimateText: values.estimateText.trim(),
        maxQuantityPerLine,
        maxItemsPerOrder,
        defaultPhoneCountry: values.defaultPhoneCountry.trim().toUpperCase(),
        orderNumberPrefix: values.orderNumberPrefix.trim().toUpperCase(),
        enforceOpeningHours: values.enforceOpeningHours,
        openingHours: values.openingHours,
      });
      setValues(toForm(updated));
      setSaved(true);
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      setFormError(Object.keys(fields).length > 0 ? null : errorMessage(error, adminText.common.unexpected));
    } finally {
      setSaving(false);
    }
  };

  const card = "space-y-4 rounded-card border border-ink/10 bg-surface p-5";
  const heading = "font-display text-2xl font-bold uppercase";

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-3xl space-y-6">
      <section aria-labelledby="s-restaurant" className={card}>
        <h2 id="s-restaurant" className={heading}>{adminText.settings.restaurant}</h2>
        <Input id="s-name" label={adminText.settings.restaurantName} {...text("restaurantName")} />
        <Input id="s-phone" label={adminText.settings.contactPhone} type="tel" {...text("contactPhone")} />
        <Textarea id="s-address" label={adminText.settings.contactAddress} rows={2} {...text("contactAddress")} />
        <Input id="s-hours-text" label={adminText.settings.hoursText} hint={adminText.settings.hoursTextHint} {...text("hoursText")} />
        <Input id="s-timezone" label={adminText.settings.timezone} hint={adminText.settings.timezoneHint} {...text("timezone")} />
      </section>

      <section aria-labelledby="s-ordering" className={card}>
        <h2 id="s-ordering" className={heading}>{adminText.settings.ordering}</h2>
        <div className="flex items-center justify-between gap-4">
          <span>{adminText.settings.pickupEnabled}</span>
          <Switch checked={values.pickupEnabled} onChange={(v) => set("pickupEnabled", v)} label={adminText.settings.pickupEnabled} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>{adminText.settings.deliveryEnabled}</span>
          <Switch checked={values.deliveryEnabled} onChange={(v) => set("deliveryEnabled", v)} label={adminText.settings.deliveryEnabled} />
        </div>
        <Input id="s-fee" label={adminText.settings.deliveryFee} inputMode="decimal" value={values.deliveryFee} error={errors.deliveryFeeMinor} onChange={(e) => set("deliveryFee", e.target.value)} />
        <Textarea id="s-delivery-note" label={adminText.settings.deliveryNote} hint={adminText.settings.deliveryNoteHint} rows={2} {...text("deliveryNote")} />
        <Input id="s-min" label={adminText.settings.minimumOrder} hint={adminText.settings.minimumHint} inputMode="decimal" value={values.minimumOrder} error={errors.minimumOrderMinor} onChange={(e) => set("minimumOrder", e.target.value)} />
        <Input id="s-estimate" label={adminText.settings.estimateText} hint={adminText.settings.estimateHint} {...text("estimateText")} />
      </section>

      <section aria-labelledby="s-pricing" className={card}>
        <h2 id="s-pricing" className={heading}>{adminText.settings.pricing}</h2>
        <Input id="s-currency" label={adminText.settings.currency} hint={adminText.settings.currencyHint} maxLength={3} {...text("currency")} />
        <Input id="s-locale" label={adminText.settings.locale} hint={adminText.settings.localeHint} {...text("locale")} />
        <Input id="s-max-qty" label={adminText.settings.maxQuantity} inputMode="numeric" value={values.maxQuantityPerLine} error={errors.maxQuantityPerLine} onChange={(e) => set("maxQuantityPerLine", e.target.value)} />
        <Input id="s-max-items" label={adminText.settings.maxItems} inputMode="numeric" value={values.maxItemsPerOrder} error={errors.maxItemsPerOrder} onChange={(e) => set("maxItemsPerOrder", e.target.value)} />
        <Input id="s-country" label={adminText.settings.phoneCountry} hint={adminText.settings.phoneCountryHint} maxLength={2} {...text("defaultPhoneCountry")} />
        <Input id="s-prefix" label={adminText.settings.orderPrefix} hint={adminText.settings.orderPrefixHint} maxLength={6} {...text("orderNumberPrefix")} />
      </section>

      <section aria-labelledby="s-hours" className={card}>
        <h2 id="s-hours" className={heading}>{adminText.settings.hours}</h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p>{adminText.settings.enforceHours}</p>
            <p className="text-sm text-muted">{adminText.settings.enforceHoursHint}</p>
          </div>
          <Switch checked={values.enforceOpeningHours} onChange={(v) => set("enforceOpeningHours", v)} label={adminText.settings.enforceHours} />
        </div>
        <OpeningHoursEditor value={values.openingHours} onChange={(rows) => set("openingHours", rows)} error={errors.openingHours} />
      </section>

      {formError && (
        <p role="alert" className="font-semibold text-tomato-dark">
          {formError}
        </p>
      )}
      {Object.keys(errors).length > 0 && !formError && (
        <p role="alert" className="font-semibold text-tomato-dark">
          {Object.values(errors).slice(0, 3).join(" ")}
        </p>
      )}
      {saved && (
        <p role="status" className="font-semibold">
          {adminText.settings.saved}
        </p>
      )}
      <Button type="submit" size="lg" loading={saving}>
        {saving ? adminText.common.saving : adminText.common.save}
      </Button>
    </form>
  );
}

export function SettingsView() {
  const [state, setState] = useState<AdminSettings | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((settings) => {
        if (!cancelled) setState(settings);
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (state === null) {
    return (
      <div className="max-w-3xl space-y-4" aria-hidden="true">
        <Skeleton className="h-48 rounded-card bg-ink/10" />
        <Skeleton className="h-64 rounded-card bg-ink/10" />
      </div>
    );
  }
  if (state === "failed") {
    return (
      <ErrorState
        message={adminText.common.loadError}
        onRetry={() => {
          setState(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  return <SettingsForm initial={state} />;
}