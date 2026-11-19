
<div align="center">
  <img src="https://github.com/user-attachments/assets/03ba0ce8-aa83-4f9e-b829-23a66ec599cc" alt="logo" width="150"/>
  <h1>Gradia Capture</h1>
</div>

<br/>
<div align="center">
  <p style="margin-bottom: 16px;">
    Enhances the GNOME built-in screenshot tool with the annotation features you would expect.
  </p>

  <img width="1920" height="1080" alt="Screenshot From 2026-04-25 10-51-19" src="https://github.com/user-attachments/assets/e1969f03-b07b-4cd3-9b4c-dc6c53d8d402" />
</div>
<br/>

Includes features like annotations, custom saving options and integration with the [Gradia App from Flathub](https://flathub.org/en/apps/be.alexandervanhee.gradia), including OCR text recognition.

> [!IMPORTANT]
>  Unlike the Gradia app, this extension is not part of GNOME Circle.

> [!IMPORTANT]
> The [GNOME Code of Conduct](https://conduct.gnome.org) applies to this project, including this repository.

## Plans for fork
- [x] Remove hardcoded save paths and filenames in favor of system defaults matching the user's locale.
- [x] Add support for non-Latin keyboard layouts.
- [ ] Try resolve issues from the original Gradia extension.
- [ ] Redesign preferences.
- [ ] Make top-bar/panel UI elements optional.
- [ ] Allow choosing between native system notifications and Gradia's custom notifications.
- [ ] "Open in..." action. Add an option in the extension settings to open screenshot directly in the Gradia app or a custom editor.
- [ ] Add support for localization.
- [ ] Try to create an optional layout for screenshot editing that resembles GNOME Overview.
- [ ] Attempt to publish on GNOME Extensions or submit changes upstream via pull requests.
- [ ] Support for the next GNOME version.

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Dymkom/gradia-capture.git
cd gradia-capture
```

### 2. Build and install

Run the following command from the root directory of the cloned repo:

```bash
./build.sh -i
```

The `-i` flag tells the script to both build the project and install it automatically.
