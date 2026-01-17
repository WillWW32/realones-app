# Fastlane Setup for REALones

## Quick Start

### 1. Install Fastlane
```bash
brew install fastlane
```

### 2. Update Credentials
Edit `fastlane/Appfile`:
```ruby
apple_id("YOUR_APPLE_ID@email.com")  # Change this
```

### 3. Upload Metadata
```bash
cd realones-app
fastlane deliver
```

That's it! Fastlane will upload all metadata to App Store Connect.

---

## Files Structure

```
fastlane/
├── Appfile              # Apple credentials
├── Deliverfile          # Upload configuration
├── rating_config.json   # Age rating answers
├── metadata/
│   └── en-US/
│       ├── name.txt             # App name
│       ├── subtitle.txt         # Subtitle (30 chars)
│       ├── description.txt      # Full description
│       ├── keywords.txt         # Keywords (100 chars)
│       ├── promotional_text.txt # Promo text (170 chars)
│       ├── release_notes.txt    # What's New
│       ├── support_url.txt      # Support URL
│       ├── marketing_url.txt    # Marketing URL
│       ├── privacy_url.txt      # Privacy Policy URL
│       └── copyright.txt        # Copyright
└── screenshots/         # Add screenshots here (optional)
    └── en-US/
        ├── iPhone 6.7/
        ├── iPhone 6.5/
        └── iPad Pro 12.9/
```

---

## Commands

### Upload metadata only
```bash
fastlane deliver --skip_screenshots --skip_binary_upload
```

### Upload screenshots only
```bash
fastlane deliver --skip_metadata --skip_binary_upload
```

### Preview what will be uploaded (dry run)
```bash
fastlane deliver --skip_binary_upload --force
```

### Download existing metadata from App Store Connect
```bash
fastlane deliver download_metadata
```

---

## Screenshots

To upload screenshots, create folders:
```
fastlane/screenshots/en-US/
├── iPhone 6.7 Display/    # 1290x2796 or 1242x2688
├── iPhone 6.5 Display/    # 1284x2778 or 1242x2688
├── iPhone 5.5 Display/    # 1242x2208
└── iPad Pro 12.9/         # 2048x2732
```

Name screenshots with numbers for ordering:
```
01_hero.png
02_feed.png
03_friends.png
```

---

## App Store Connect API (Recommended)

For automated CI/CD, use API key instead of password:

1. Go to: https://appstoreconnect.apple.com/access/api
2. Generate a new key with "App Manager" access
3. Download the .p8 file
4. Update `Appfile`:
```ruby
key_id("YOUR_KEY_ID")
issuer_id("YOUR_ISSUER_ID")
key_filepath("./fastlane/AuthKey_XXXXX.p8")
```

---

## Troubleshooting

### "Invalid credentials"
- Check Apple ID in Appfile
- Try: `fastlane spaceauth -u YOUR_APPLE_ID`

### "App not found"
- Make sure bundle ID matches: `app.realones`
- Check Team ID: `K4FVH97L69`

### Two-factor authentication
Run once to cache session:
```bash
fastlane spaceauth -u YOUR_APPLE_ID@email.com
```

---

## More Info
- Fastlane docs: https://docs.fastlane.tools/actions/deliver/
- App Store metadata specs: https://developer.apple.com/help/app-store-connect/
