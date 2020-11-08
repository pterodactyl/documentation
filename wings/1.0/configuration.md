# Additional Configuration

[[toc]]

::: warning
These are advanced configurations for wings. You risk breaking wings and making containers un-usable if
you modify something incorrectly. Proceed at your own risk, and only if you know what each configuration value does.
:::

## Private Registries

These settings are used to allow usage of private docker registries with pterodactyl.

### Available Keys

| Setting Key | Default Value | Notes |
|-------------|---------------|-------|
| name        | null          | Registry address |
| username    | null          | Registry username |
| password    | null          | Registry password |


### Usage Example

```yml
docker:
  registries:
    registry.example.com:
      username: "registryusername"
      password: "registrypassword"
```
