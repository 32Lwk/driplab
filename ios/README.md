# DripLab iOS

SwiftUI native client for the existing DripLab web API.

## Generate the Xcode project

```sh
cd ios
xcodegen generate
open DripLabIOS.xcodeproj
```

## Run on iPhone

1. Install/select full Xcode, not only Command Line Tools.
   ```sh
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```
2. In Xcode, set a signing team for the `DripLabIOS` target.
3. Select the connected iPhone 15 Pro and run.

The app defaults to the production API at `https://coffee.yutok.dev`. Use the settings button in the app to switch to a local API such as `http://<Mac LAN IP>:3000` when running `npm run dev`.

If the local API is unreachable from the iPhone, make sure the iPhone and Mac are on the same network and use the Mac's LAN IP, not `localhost`.
