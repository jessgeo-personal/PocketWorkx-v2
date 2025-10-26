# Environments

This project uses Expo and branch-based configuration for two environments:

- Development (main branch)
- Staging (staging branch)

## Branches

- main: development config in app.json (com.pocketworkx.app.dev)
- staging: staging config in app.json (com.pocketworkx.app.staging)

## Running locally

- Development: `npm run start:dev`
- Staging: `npm run start:staging`

## Build profiles (EAS)

When enabling EAS builds, add `eas.json` with profiles:

```
{
  "cli": { "version": ">= 8.0.0" },
  "build": {
    "development": {
      "channel": "development",
      "env": { "EXPO_PUBLIC_ENV": "development" }
    },
    "staging": {
      "channel": "staging",
      "env": { "EXPO_PUBLIC_ENV": "staging" }
    }
  },
  "submit": {}
}
```

## Environment flag in code

Use `process.env.EXPO_PUBLIC_ENV` or `Constants.expoConfig.extra.env` to toggle behavior.
