import {
  type RecipeVariant,
  type RecipeVariantProps,
  css,
  cva,
} from '@/styled-system/css';

export type LabelColorVariant = RecipeVariant<typeof labelOption>['type'];
export type LabelOptionVariantProps = RecipeVariantProps<typeof labelOption>;

export const toLabelColor = (color: unknown): LabelColorVariant => {
  const variants = labelOption.variantMap.type;
  return (variants as unknown[]).includes(color)
    ? (color as LabelColorVariant)
    : 'plain';
};

export const labelOption = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 'semibold',
    px: '3',
    py: '1',
    rounded: 'full',
    w: '12rem',
    justifyContent: 'space-between',
  },
  variants: {
    type: {
      plain: {
        color: 'zinc.800',
        border: '1px solid',
        borderColor: 'gray.300',
      },
      blue: {
        bg: 'blue.200',
        color: 'blue',
      },
      red: {
        bg: 'rose.200',
        color: 'red',
      },
      yellow: {
        bg: 'orange.200',
        color: 'orange.600',
      },
      green: {
        bg: 'green.200',
        color: 'green.600',
      },
      gray: {
        bg: 'neutral.200',
        color: 'white',
      },
    },
  },
  defaultVariants: {
    type: 'plain',
  },
});

export const tagStyle = css.raw({
  w: 'fit-content',
  py: '0',
});

export const colorInputStyle = cva({
  base: {
    outline: '1px solid',
    rounded: 'md',
    h: '2rem',
    paddingInline: '2',
  },
  variants: {
    type: {
      plain: {
        outlineColor: 'zinc.600',
      },
      blue: {
        outlineColor: 'blue.600',
      },
      red: {
        outlineColor: 'rose.600',
      },
      yellow: {
        outlineColor: 'orange.600',
      },
      green: {
        outlineColor: 'green.600',
      },
      gray: {
        outlineColor: 'neutral.600',
      },
    },
  },
  defaultVariants: {
    type: 'plain',
  },
});

export const colorOptionStyle = cva({
  base: {
    w: '2rem',
    h: '2rem',
    rounded: 'full',
    border: 'none',
    outline: '1px solid',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  variants: {
    type: {
      plain: {
        bg: 'white',
        outlineColor: 'zinc.600',
      },
      blue: {
        bg: 'blue.200',
        outlineColor: 'blue.600',
      },
      red: {
        bg: 'rose.200',
        outlineColor: 'rose.600',
      },
      yellow: {
        bg: 'orange.200',
        outlineColor: 'orange.600',
      },
      green: {
        bg: 'green.200',
        outlineColor: 'green.600',
      },
      gray: {
        bg: 'neutral.200',
        outlineColor: 'neutral.600',
      },
    },
  },
  defaultVariants: {
    type: 'plain',
  },
});
