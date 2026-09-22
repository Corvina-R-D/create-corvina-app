import { h } from 'vue'
import { type IconSet, type IconAliases, type IconProps } from 'vuetify'

const aliases: IconAliases | undefined = undefined

const ecc: IconSet = {
  // Not using mergeProps here, functional components merge props by default (?)
  component: (props: IconProps) => h(props.tag, { ...props, class: `ecc ${props.icon}` }),
}

export { aliases, ecc }
