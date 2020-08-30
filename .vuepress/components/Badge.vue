<script>
    export default {
        functional: true,
        props: {
            type: {
                type: String,
                default: 'tip'
            },
            text: String,
            vertical: {
                type: String,
                default: 'top'
            }
        },
        render (h, { props, slots }) {
            return h('span', {
                class: ['badge', props.type],
                style: {
                    verticalAlign: props.vertical
                }
            }, props.text || slots().default)
        }
    }
</script>
