"use client";

import * as React from "react";
import { Button, Input, Modal, useToast } from "@geopin/ui";
import { COUNTRIES, type CountryOption } from "@/lib/countries";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { CreateMapPackRequest, MapPack } from "@geopin/types";

export interface CreatePackModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (pack: MapPack) => void;
}

const REGIONS: CountryOption["region"][] = [
  "Americas",
  "Europe",
  "Asia",
  "Oceania",
  "Africa",
];

export const CreatePackModal: React.FC<CreatePackModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const token = useAuthStore((s) => s.token);
  const toast = useToast();
  const { t } = useI18n();
  const [name, setName] = React.useState("");
  const [emoji, setEmoji] = React.useState("🗺️");
  const [description, setDescription] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [isPublic, setIsPublic] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setName("");
      setEmoji("🗺️");
      setDescription("");
      setSelected(new Set());
      setIsPublic(false);
    }
  }, [open]);

  const toggle = (code: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const selectRegion = (region: CountryOption["region"]) => {
    setSelected((prev) => {
      const regionCodes = COUNTRIES.filter((c) => c.region === region).map(
        (c) => c.code,
      );
      const allPicked = regionCodes.every((c) => prev.has(c));
      const next = new Set(prev);
      if (allPicked) regionCodes.forEach((c) => next.delete(c));
      else regionCodes.forEach((c) => next.add(c));
      return next;
    });
  };

  const save = async () => {
    if (!name.trim() || selected.size === 0) return;
    setSaving(true);
    try {
      const payload: CreateMapPackRequest = {
        name: name.trim(),
        emoji: emoji.trim() || "🗺️",
        description: description.trim(),
        countries: Array.from(selected),
        isPublic,
      };
      const pack = await api.post<MapPack>("/packs", payload, token ?? undefined);
      toast.push({
        tone: "success",
        title: t("pack.created", { name: pack.name }),
      });
      onCreated(pack);
      onClose();
    } catch (err) {
      toast.push({
        tone: "danger",
        title: t("pack.couldNotCreate"),
        description: (err as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("pack.title")} size="lg">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <Input
            label={t("pack.emoji")}
            value={emoji}
            maxLength={4}
            onChange={(e) => setEmoji(e.target.value)}
            className="text-center text-xl"
          />
          <Input
            label={t("pack.name")}
            placeholder={t("pack.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <Input
          label={t("pack.description")}
          placeholder={t("pack.descPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              {t("pack.countries", { n: selected.size })}
            </label>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-ink-dim hover:text-ink"
              >
                {t("pack.clear")}
              </button>
            )}
          </div>
          <div className="max-h-[340px] overflow-y-auto flex flex-col gap-3 pr-1">
            {REGIONS.map((region) => {
              const countries = COUNTRIES.filter((c) => c.region === region);
              const picked = countries.filter((c) =>
                selected.has(c.code),
              ).length;
              return (
                <div key={region}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase tracking-wider text-ink-muted">
                      {t(`pack.region.${region}`)}{" "}
                      {picked > 0 && (
                        <span className="text-brand-cyan">({picked})</span>
                      )}
                    </span>
                    <button
                      onClick={() => selectRegion(region)}
                      className="text-[11px] text-ink-dim hover:text-brand-cyan"
                    >
                      {t("pack.toggleRegion")}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                    {countries.map((c) => {
                      const on = selected.has(c.code);
                      return (
                        <button
                          key={c.code}
                          onClick={() => toggle(c.code)}
                          className={
                            "flex items-center gap-2 px-3 h-9 rounded-lg border text-sm transition " +
                            (on
                              ? "border-brand-cyan/60 bg-brand-cyan/10 text-brand-cyan"
                              : "border-border hover:border-brand-cyan/30 text-ink-muted")
                          }
                        >
                          <span className="text-lg leading-none">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="accent-brand-cyan"
          />
          {t("pack.makePublic")}
        </label>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            {t("pack.cancel")}
          </Button>
          <Button
            onClick={save}
            loading={saving}
            disabled={!name.trim() || selected.size === 0}
          >
            {t("pack.create")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
