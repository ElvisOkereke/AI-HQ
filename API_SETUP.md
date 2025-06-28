# API Setup Guide

This guide will help you set up API keys for the various AI providers supported by this chat application.

## Required Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

## API Key Setup

### 1. Google AI (Gemini) - Required

**How to get:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

**Add to .env.local:**
```
GOOGLE_API_KEY=your_google_api_key_here
```

**Models supported:**
- Gemini 2.0 Flash (multimodal)
- Gemini 2.5 Flash Preview (experimental)
- Gemini 2.0 Flash Image Generation

### 2. HuggingFace Inference API

**How to get:**
1. Go to [HuggingFace](https://huggingface.co/)
2. Create an account or sign in
3. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token"
5. Give it a name and select "Read" role
6. Copy the generated token

**Add to .env.local:**
```
HUGGINGFACE_API_TOKEN=your_huggingface_token_here
```

**Models supported:**
- Llama 2 7B/13B Chat
- Mistral 7B Instruct
- Zephyr 7B Beta
- Many more open-source models

**Note:** Some HuggingFace models may require additional setup or have usage limits on the free tier.

### 3. Nvidia NIM (Neural Inference Microservices)

**How to get:**
1. Go to [Nvidia NGC](https://catalog.ngc.nvidia.com/)
2. Create an account or sign in
3. Navigate to [API Keys](https://org.ngc.nvidia.com/setup/api-key)
4. Generate a new API key
5. Copy the generated key

**Add to .env.local:**
```
NVIDIA_API_KEY=your_nvidia_api_key_here
```

**Models supported:**
- Llama 3.1 8B/70B Instruct
- Llama 3.2 11B/90B Vision (supports image uploads)
- Phi-3 Vision 128k
- More enterprise-grade models

**Note:** Nvidia NIM may require credits or have usage limits depending on your account type.

## Model Features

### Google Models
- ✅ Text generation with streaming
- ✅ Image upload and analysis
- ✅ File upload support
- ✅ Image generation (specific models)
- ✅ Large context windows (1M+ tokens)

### HuggingFace Models
- ✅ Text generation with streaming
- ❌ Image upload (most models)
- ❌ File upload
- ❌ Image generation (limited models)
- ✅ Open-source and free options

### Nvidia NIM Models
- ✅ Text generation with streaming
- ✅ Image upload (vision models)
- ❌ File upload
- ❌ Image generation
- ✅ Enterprise-grade performance
- ✅ Large context windows (128k tokens)

## Testing Your Setup

1. Start the development server:
```bash
npm run dev
```

2. Open the application and try sending a message with different models
3. Check the browser console and server logs for any API errors
4. If a model fails, verify the corresponding API key is correctly set

## Troubleshooting

### Common Issues

**"Provider not found" error:**
- Make sure you've copied the environment variables correctly
- Restart your development server after adding new environment variables

**API key errors:**
- Double-check your API keys are valid and haven't expired
- Ensure you have sufficient credits/quota for paid APIs
- Check that your API keys have the correct permissions

**Model not responding:**
- Some HuggingFace models may be slow or temporarily unavailable
- Try switching to a different model from the same provider
- Check the provider's status page for outages

**Rate limiting:**
- You may be hitting API rate limits
- Try using different models or wait before making more requests
- Consider upgrading to paid tiers for higher limits

## Adding More Models

To add more models, edit `src/app/components/client/ModelDropdown.tsx` and add new entries to the `llmModels` array. Make sure to:

1. Set the correct `provider` field
2. Configure appropriate `features`
3. Add the model to the corresponding provider class
4. Test the integration

## Cost Considerations

- **Google AI:** Pay-per-use with generous free tier
- **HuggingFace:** Free tier available, some models require payment
- **Nvidia NIM:** Enterprise pricing, may require credits

Monitor your usage and set up billing alerts where applicable.
