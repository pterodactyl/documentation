# Additional Configuration

[[toc]]

::: warning
These are advanced configurations for Wings. You risk breaking Wings and making containers unusable if
you configure something incorrectly. Proceed only if you know what each configuration value does.
:::

## Private Registries

These settings can be used to authenticate against (private) docker registries when pulling images.

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
