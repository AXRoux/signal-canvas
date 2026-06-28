import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  Link2,
  FileText,
  Download,
  Eye,
  Settings,
  Waves,
  Crown,
  Flag,
  Zap,
  Search,
} from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import { KbdHint } from "./ui/KbdHint";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (command: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onSelect,
}: CommandPaletteProps) {
  const copy = useI18n();

  const actionItems = [
    {
      label: copy.commandPalette.commands.scan,
      value: "scan handle target account graph",
      command: "scan",
      icon: Radar,
    },
    {
      label: copy.commandPalette.commands.correlate,
      value: "correlate linked accounts graph",
      command: "correlate linked accounts",
      icon: Link2,
    },
    {
      label: copy.commandPalette.commands.watch,
      value: "watch keyword photo manda",
      command: 'watch keyword "send photo"',
      icon: Eye,
    },
    {
      label: copy.commandPalette.commands.brief,
      value: "brief generate ngo review",
      command: "generate brief for NGO review",
      icon: FileText,
    },
    {
      label: copy.commandPalette.commands.exportPdf,
      value: "export pdf packet review",
      command: "export pdf",
      icon: Download,
    },
    {
      label: copy.nav.telegram,
      value: "telegram monitor chat join",
      command: "open telegram",
      icon: Eye,
    },
    {
      label: copy.commandPalette.commands.openSettings,
      value: "open settings preferences config",
      command: "open settings",
      icon: Settings,
    },
  ];

  const groups = [
    {
      group: copy.commandPalette.groups.actions,
      items: actionItems,
    },
    {
      group: copy.commandPalette.groups.themes,
      items: [
        {
          label: copy.commandPalette.commands.themeStratir,
          value: "theme stratir industrial impact paper",
          command: "switch to stratir theme",
          icon: Zap,
        },
        {
          label: copy.commandPalette.commands.themeMykonos,
          value: "theme mykonos athens light aegean",
          command: "switch to mykonos theme",
          icon: Waves,
        },
        {
          label: copy.commandPalette.commands.themeMonaco,
          value: "theme monaco azur dark red",
          command: "switch to monaco theme",
          icon: Crown,
        },
        {
          label: copy.commandPalette.commands.themeAngola,
          value: "theme angola gold dark",
          command: "switch to angola theme",
          icon: Flag,
        },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="command-palette-backdrop"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="command-palette-shell"
          >
            <Command
              className="command-palette"
              loop
              onKeyDown={(e) => {
                if (e.key === "Escape") onOpenChange(false);
              }}
            >
              <div className="command-palette-header">
                <div className="command-palette-search-row">
                  <Search size={16} className="command-palette-search-icon" />
                  <Command.Input
                    placeholder={copy.commandPalette.searchPlaceholder}
                    className="command-palette-input"
                    autoFocus
                  />
                  <KbdHint keys={["esc"]} className="hidden sm:flex" />
                </div>
                <p className="command-palette-title">{copy.commandPalette.title}</p>
              </div>

              <Command.List className="command-palette-list">
                <Command.Empty className="command-palette-empty">
                  {copy.commandPalette.empty}
                </Command.Empty>
                {groups.map((group) => (
                  <Command.Group key={group.group} heading={group.group} className="command-palette-group">
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.command}
                        value={`${item.label} ${item.value}`}
                        onSelect={() => {
                          onSelect(item.command);
                          onOpenChange(false);
                        }}
                        className="command-palette-item"
                      >
                        <span className="command-palette-item-icon">
                          <item.icon size={14} strokeWidth={1.75} />
                        </span>
                        <span className="command-palette-item-label">{item.label}</span>
                        <KbdHint keys={["↵"]} className="command-palette-item-kbd" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              <div className="command-palette-footer">
                <span className="command-palette-footer-hint">
                  <KbdHint keys={["↑", "↓"]} />
                  {copy.commandPalette.footerNavigate}
                </span>
                <span className="command-palette-footer-hint">
                  <KbdHint keys={["↵"]} />
                  {copy.commandPalette.footerSelect}
                </span>
                <span className="command-palette-footer-hint">
                  <KbdHint keys={["esc"]} />
                  {copy.commandPalette.footerClose}
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
