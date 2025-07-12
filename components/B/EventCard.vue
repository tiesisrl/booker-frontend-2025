<script setup lang="ts">
interface Props {
    event: any;
    disabled?: boolean;
    list?: boolean;
}
defineEmits(['clicked', 'submit'])
const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    list: false,
});
const imageUrl = ref("https://oktoberfestcalabria.com/wp-content/uploads/elementor/thumbs/tendone-paulaner-oktoberfest.jpg-2-pu3ae2bqeoqa05wvbv8j40sua0crlgkk8gye9zmu8o.webp")

</script>

<template>
    <div class="p-card p-component border-round-2xl p-0 border-1 surface-border shadow-1">
        <div class="flex flex-column sm:flex-row sm:align-items-start p-2 gap-3 min-h-full">
            <div class="md:w-8rem relative">
                <img class="block xl:block mx-auto border-round-lg w-full" :src="imageUrl" :alt="event.date" />
            </div>
            <div
                class="flex flex-column md:flex-row justify-content-between md:align-items-start flex-1 gap-4 p-2 h-full">
                <div class="flex flex-row md:flex-column justify-content-between align-items-start gap-2">
                    <div>
                        <span class="font-medium text-secondary text-800 text-xl">{{ event.formatted_date }}</span>

                        <div class="text-lg font-medium mt-1 text-600 mt-2">
                            <div class="font-normal"><i class="pi pi-clock pr-1"></i> Ingresso {{
                                event.shift.start_time?.substring(0, 5) }}</div>
                            <!-- <div class="font-normal">Spettacolo live</div> -->
                        </div>
                    </div>
                    <div class="flex-grow-1 mt-3 p-0">
                        <div v-html="event.description_html" class="p-0 m-0"></div>
                    </div>
                    <div>
                        <!-- <span class="font-medium text-secondary text-2xl">{{ event.formatted_date }}</span> -->
                        <!-- <div class="text-lg font-medium text-900 mt-2">{{ item.name }}</div> -->
                    </div>
                </div>
                <div class="flex flex-row align-items-end gap-5 h-7rem">
                    <Button icon="pi pi-shopping-cartx" label="Prenota" size="large"
                        class="align-self-end w-full md:w-auto" @click="$emit('clicked')"
                        :disabled="!event.booking_enable"></Button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
