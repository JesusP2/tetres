export const models = [
  {
    id: 'google/gemini-2.5-pro-preview',
    name: 'Google: Gemini 2.5 Pro Preview 06-05',
    architecture: {
      modality: 'text+image->text',
      input_modalities: ['file', 'image', 'text'],
      output_modalities: ['text'],
      tokenizer: 'Gemini',
      instruct_type: null,
    },
    supported_parameters: [
      'tools',
      'tool_choice',
      'reasoning',
      'include_reasoning',
      'stop',
    ],
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Anthropic: Claude Sonnet 4',
    architecture: {
      modality: 'text+image->text',
      input_modalities: ['image', 'text'],
      output_modalities: ['text'],
      tokenizer: 'Claude',
      instruct_type: null,
    },
    supported_parameters: [
      'stop',
      'reasoning',
      'include_reasoning',
      'tools',
      'tool_choice',
    ],
  },
  {
    id: 'google/gemini-2.5-flash-preview-05-20',
    name: 'Google: Gemini 2.5 Flash Preview 05-20',
    architecture: {
      modality: 'text+image->text',
      input_modalities: ['image', 'text', 'file'],
      output_modalities: ['text'],
      tokenizer: 'Gemini',
      instruct_type: null,
    },
    supported_parameters: [
      'tools',
      'tool_choice',
      'reasoning',
      'include_reasoning',
      'stop',
    ],
  },
  {
    id: 'openai/gpt-4.1',
    name: 'OpenAI: GPT-4.1',
    architecture: {
      modality: 'text+image->text',
      input_modalities: ['image', 'text', 'file'],
      output_modalities: ['text'],
      tokenizer: 'GPT',
      instruct_type: null,
    },
    supported_parameters: [
      'tools',
      'tool_choice',
      'stop',
      'web_search_options',
    ],
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: 'OpenAI: GPT-4.1 Mini',
    architecture: {
      modality: 'text+image->text',
      input_modalities: ['image', 'text', 'file'],
      output_modalities: ['text'],
      tokenizer: 'GPT',
      instruct_type: null,
    },
    supported_parameters: [
      'tools',
      'tool_choice',
      'stop',
      'web_search_options',
    ],
  },
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Anthropic: Claude 3.7 Sonnet',
    architecture: {
      modality: 'text+image->text',
      input_modalities: ['text', 'image'],
      output_modalities: ['text'],
      tokenizer: 'Claude',
      instruct_type: null,
    },
    supported_parameters: [
      'stop',
      'reasoning',
      'include_reasoning',
      'tools',
      'tool_choice',
    ],
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Google: Gemini 2.0 Flash',
    architecture: {
      modality: 'text+image->text',
      input_modalities: ['text', 'image', 'file'],
      output_modalities: ['text'],
      tokenizer: 'Gemini',
      instruct_type: null,
    },
    supported_parameters: ['tools', 'tool_choice', 'stop'],
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'OpenAI: GPT-4o-mini',
    architecture: {
      modality: 'text+image->text',
      input_modalities: ['text', 'image', 'file'],
      output_modalities: ['text'],
      tokenizer: 'GPT',
      instruct_type: null,
    },
    supported_parameters: [
      'stop',
      'web_search_options',
      'tools',
      'tool_choice',
    ],
  },
] as const;

export const defaultModel = 'google/gemini-2.0-flash-001' as const;
export const modelIds = models.map(m => m.id);
export type ModelId = (typeof modelIds)[number];
