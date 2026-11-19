import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import GdkPixbuf from 'gi://GdkPixbuf';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';

const SHELL_MAJOR = parseInt(Config.PACKAGE_VERSION, 10);

const FORMAT_INFO = [
    { id: 'png',  label: 'PNG'  },
    { id: 'webp', label: 'WebP' },
    { id: 'avif', label: 'AVIF' },
];

const GRADIA_FLATPAK_ID = 'be.alexandervanhee.gradia';
const GRADIA_DESKTOP_ID = `${GRADIA_FLATPAK_ID}.desktop`;

function isGradiaInstalled() {
    const appInfo = Gio.DesktopAppInfo.new(GRADIA_DESKTOP_ID);
    if (!appInfo)
        return false;
    return !!appInfo.get_string('X-Flatpak');
}

const AboutPage = GObject.registerClass(
    class AboutPage extends Adw.PreferencesPage {
        constructor(settings) {
            super({
                title: 'Preferences',
                icon_name: 'org.gnome.Settings-symbolic',
            });
            this._settings = settings;
            this._setupCss();
            this._buildDonationGroup();
            this._buildTextRecognitionGroup();
            this._buildScreenshotGroup();
        }

        _setupCss() {
            const cssProvider = new Gtk.CssProvider();
            cssProvider.load_from_string(`
            .donation-card {
                background: linear-gradient(to bottom left, #1b5fc0, #159eff);
                border-radius: 12px;
                padding: 16px;
                color: white;
            }
        `);
            Gtk.StyleContext.add_provider_for_display(
                Gdk.Display.get_default(),
                cssProvider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
            );
        }

        _buildDonationGroup() {
            const group = new Adw.PreferencesGroup();

            const card = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 12,
                hexpand: true,
                css_classes: ['donation-card'],
            });

            const labelBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                spacing: 2,
                valign: Gtk.Align.CENTER,
                hexpand: true,
            });

            const title = new Gtk.Label({
                label: 'Support This Extension',
                halign: Gtk.Align.START,
                css_classes: ['title-4'],
                wrap: true
            });

            const subtitle = new Gtk.Label({
                label: 'If you enjoy my work, consider donating!',
                halign: Gtk.Align.START,
                wrap: true,
            });

            const button = new Gtk.LinkButton({
                label: 'Donate',
                uri: 'https://ko-fi.com/alexandervanhee',
                valign: Gtk.Align.CENTER,
                css_classes: ['pill'],
            });

            labelBox.append(title);
            labelBox.append(subtitle);
            card.append(labelBox);
            card.append(button);

            group.add(card);
            this.add(group);
        }

        _buildTextRecognitionGroup() {
            this._ocrGroup = new Adw.PreferencesGroup({ title: 'Text Recognition' });
            this.add(this._ocrGroup);
            this._ocrRow = null;
            this._refreshOcrRow();

            const monitor = Gio.AppInfoMonitor.get();
            this._appInfoMonitor = monitor;
            this._appInfoChangedId = monitor.connect('changed', () => this._refreshOcrRow());
        }

        _refreshOcrRow() {
            const installed = isGradiaInstalled();

            if (this._ocrRow) {
                this._ocrGroup.remove(this._ocrRow);
                this._ocrRow = null;
            }

            const row = new Adw.ActionRow(installed ? {
                title: 'Gradia Installed',
                subtitle: 'OCR text extraction is available in the screenshot UI',
            } : {
                title: 'Get the Gradia Flatpak',
                subtitle: 'Install the app via Flathub to enable the OCR text extraction feature',
                activatable: true,
            });

            row.add_suffix(new Gtk.Image({
                icon_name: installed ? 'object-select-symbolic' : 'go-next-symbolic',
                css_classes: installed ? ['success'] : [],
                valign: Gtk.Align.CENTER,
            }));

            if (!installed)
              row.connect('activated', () =>
                  Gtk.show_uri(null, `appstream://${GRADIA_FLATPAK_ID}`, Gdk.CURRENT_TIME));

            this._ocrGroup.add(row);
            this._ocrRow = row;
        }

        _buildScreenshotGroup() {
            const group = new Adw.PreferencesGroup({ title: 'Screenshot' });

            const availableIds = new Set(
                GdkPixbuf.Pixbuf.get_formats()
                    .filter(f => f.is_writable())
                    .map(f => f.get_name())
            );

            const formats = FORMAT_INFO.filter(f => availableIds.has(f.id));

            const formatRow = new Adw.ComboRow({
                title: 'File Format',
                subtitle: 'Changing this may slow down saving',
            });

            const model = new Gtk.StringList();
            for (const fmt of formats)
                model.append(fmt.label);

            formatRow.set_model(model);

            const currentFormat = this._settings.get_string('screenshot-format');
            const currentIndex = formats.findIndex(f => f.id === currentFormat);
            formatRow.set_selected(currentIndex >= 0 ? currentIndex : formats.findIndex(f => f.id === 'png'));

            formatRow.connect('notify::selected', () => {
                const selected = formats[formatRow.get_selected()];
                if (selected)
                    this._settings.set_string('screenshot-format', selected.id);
            });

            const clearSelectionRow = new Adw.SwitchRow({
                title: 'Disable Initial Selection',
                subtitle: 'Hide the default or last pre-selected area when the overlay opens',
            });

            this._settings.bind('clear-selection', clearSelectionRow, 'active', Gio.SettingsBindFlags.DEFAULT);

            const compositeWindowRow = new Adw.SwitchRow({
                title: 'Include Parent Windows',
                subtitle: 'Also capture parent windows when a transient window is selected',
            });

            this._settings.bind('composite-window-capture', compositeWindowRow, 'active', Gio.SettingsBindFlags.DEFAULT);

            const soundRow = new Adw.SwitchRow({
                title: 'Sound',
                subtitle: 'Play a shutter sound effect on capture',
            });

            this._settings.bind('play-sound', soundRow, 'active', Gio.SettingsBindFlags.DEFAULT);

            group.add(formatRow);
            group.add(clearSelectionRow);
            group.add(compositeWindowRow);
            group.add(soundRow);
            this.add(group);
        }
    });

let _shortcutCssLoaded = false;

function ensureShortcutCss() {
    if (_shortcutCssLoaded)
        return;
    const provider = new Gtk.CssProvider();
    provider.load_from_string('.gradia-shortcut-status .icon { -gtk-icon-size: 48px; }');
    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
    _shortcutCssLoaded = true;
}

// Map keycode to its physical Latin keyval so shortcuts recorded on non-Latin
// layouts stay layout-independent.
function latinKeyval(keyval, keycode) {
    if (keyval >= 0x20 && keyval <= 0x7e)
        return keyval;
    try {
        const [ok, , keyvals] = Gdk.Display.get_default().map_keycode(keycode);
        if (ok) {
            const latin = keyvals.find(v => (v >= 0x61 && v <= 0x7a) || (v >= 0x30 && v <= 0x39));
            if (latin)
                return latin;
        }
    } catch (_e) {
        // Fall back to the original keyval.
    }
    return keyval;
}

const ShortcutsPage = GObject.registerClass(
    class ShortcutsPage extends Adw.PreferencesPage {
        constructor(settings) {
            super({
                title: 'Shortcuts',
                icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
            });

            this._settings = settings;
            ensureShortcutCss();

            this._addGroup('Screenshot Mode', [
                ['Take Screenshot / Capture',  'Return space'],
                ['Copy to Clipboard',          '<Control>c', 'gradia-copy'],
                ['Save As…',                   '<Control>s', 'gradia-save-as'],
                ['Extract Text (OCR)',         '<Control>e', 'gradia-ocr'],
                ['Area Selection',             's'],
                ['Screen Selection',           'c'],
                ['Window Selection',           'w'],
                ['Toggle Pointer Visibility',  'p'],
                ['Toggle Screen Recording',    'v'],
                // GNOME 51: the shell binds "r" to resetting the selection.
                ...(SHELL_MAJOR >= 51 ? [['Reset Selection', 'r']] : []),
            ]);

            this._addGroup('Annotations', [
                ['Undo Last Stroke',     '<Control>z', 'gradia-undo'],
                ['Delete Selected',      'Delete BackSpace'],
                ['Crop Tool',            '1 q'],
                ['Drag Tool',            '2 d'],
                ['Freehand Tool',        '3 f'],
                ['Rectangle Tool',       SHELL_MAJOR >= 51 ? '4' : '4 r'],
                ['Solid Rectangle Tool', '5 b'],
                ['Highlighter Tool',     '6 h'],
                ['Arrow Tool',           '7 a'],
                ['Text Tool',            '8 t'],
                ['Number Stamp Tool',    '9 n'],
            ]);

            this._addSystemKeybindingsGroup();
        }

        _addGroup(title, entries, note = null) {
            const group = new Adw.PreferencesGroup({ title });
            if (note)
                group.set_description(note);
            for (const [label, accel, settingKey] of entries) {
                if (settingKey) {
                    group.add(this._makeEditableRow(label, settingKey));
                    continue;
                }
                const row = new Adw.ActionRow({ title: label });
                const shortcut = new Adw.ShortcutLabel({ accelerator: accel });
                shortcut.set_valign(Gtk.Align.CENTER);
                row.add_suffix(shortcut);
                group.add(row);
            }
            this.add(group);
        }

        _makeEditableRow(label, settingKey) {
            const row = new Adw.ActionRow({ title: label, activatable: true });

            const shortcut = new Adw.ShortcutLabel({
                accelerator: '',
                disabled_text: 'Disabled',
                valign: Gtk.Align.CENTER,
            });

            const restoreButton = new Gtk.Button({
                icon_name: 'edit-undo-symbolic',
                has_frame: false,
                tooltip_text: 'Restore Default',
                valign: Gtk.Align.CENTER,
            });
            restoreButton.add_css_class('circular');

            row.add_suffix(restoreButton);
            row.add_suffix(shortcut);

            const update = () => {
                const current = this._settings.get_strv(settingKey);
                const def = this._settings.get_default_value(settingKey).deepUnpack();
                shortcut.set_accelerator(current[0] ?? '');
                const isDefault = current.length === def.length &&
                    current.every((v, i) => v === def[i]);
                restoreButton.set_visible(!isDefault);
            };
            update();
            this._settings.connect(`changed::${settingKey}`, update);

            restoreButton.connect('clicked', () => this._settings.reset(settingKey));
            row.connect('activated', () => this._captureShortcut(settingKey, row));

            return row;
        }

        _captureShortcut(settingKey, row) {
            const dialog = new Adw.Dialog({
                title: 'Set Shortcut',
                content_width: 420,
                content_height: 240,
            });

            const toolbarView = new Adw.ToolbarView();
            toolbarView.add_top_bar(new Adw.HeaderBar());

            const statusPage = new Adw.StatusPage({
                icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
                title: 'Press a Shortcut',
                description: 'Esc to cancel · Backspace to disable',
            });
            statusPage.add_css_class('compact');
            statusPage.add_css_class('gradia-shortcut-status');
            toolbarView.set_content(statusPage);
            dialog.set_child(toolbarView);

            // Require a modifier to avoid conflicting with text input.
            const REQUIRED_MODS = Gdk.ModifierType.CONTROL_MASK | Gdk.ModifierType.ALT_MASK |
                Gdk.ModifierType.SUPER_MASK | Gdk.ModifierType.META_MASK;

            const keyController = new Gtk.EventControllerKey();
            keyController.set_propagation_phase(Gtk.PropagationPhase.CAPTURE);
            keyController.connect('key-pressed', (_controller, keyval, keycode, state) => {
                let mask = state & Gtk.accelerator_get_default_mod_mask();
                mask &= ~Gdk.ModifierType.LOCK_MASK;

                if (keyval === Gdk.KEY_Escape && mask === 0) {
                    dialog.close();
                    return Gdk.EVENT_STOP;
                }

                if (keyval === Gdk.KEY_BackSpace && mask === 0) {
                    this._settings.set_strv(settingKey, []);
                    dialog.close();
                    return Gdk.EVENT_STOP;
                }

                const key = latinKeyval(keyval, keycode);
                if (!(mask & REQUIRED_MODS) || !Gtk.accelerator_valid(key, mask))
                    return Gdk.EVENT_STOP;

                const accel = Gtk.accelerator_name_with_keycode(null, key, keycode, mask);
                this._settings.set_strv(settingKey, [accel]);
                dialog.close();
                return Gdk.EVENT_STOP;
            });
            dialog.add_controller(keyController);

            dialog.present(row.get_root());
        }

        _addSystemKeybindingsGroup() {
            const shellSettings = new Gio.Settings({
                schema_id: 'org.gnome.shell.keybindings',
            });

            const entries = [
                ['Take a screenshot interactively', 'show-screenshot-ui'],
                ['Take a screencast interactively', 'show-screen-recording-ui'],
                ['Take a screenshot of a window', 'screenshot-window'],
                ['Take a screenshot', 'screenshot'],
            ];

            const group = new Adw.PreferencesGroup({ title: 'System Keybindings' });
            group.set_description('Configurable in Settings → Keyboard.');

            for (const [label, key] of entries) {
                const row = new Adw.ActionRow({ title: label });
                const accels = shellSettings.get_strv(key);
                const shortcut = new Adw.ShortcutLabel({ accelerator: accels[0] ?? '' });
                shortcut.set_valign(Gtk.Align.CENTER);
                row.add_suffix(shortcut);
                group.add(row);
            }

            this.add(group);
        }
    });

export default class GradiaPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window.add(new AboutPage(settings));
        window.add(new ShortcutsPage(settings));
    }
}
