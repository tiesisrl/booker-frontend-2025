<script setup lang="ts">
interface Props {
  event: any;
  disabled: boolean
}

const props = withDefaults(defineProps<Props>(), {
  options: [],
  disabled: false,
});

</script>

<template>
  <div class="flex">
    <div class="overflow-hidden w-30rem" style="width: 400px">
      <div class="bg-cover md:bg-contain bg-no-repeat bg-center bg-primary h-full"
        style="background-image: url('https://scontent.fbri2-1.fna.fbcdn.net/v/t39.30808-6/451833470_1047564307374597_1341913103216127484_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=FK6YAKsTwUwQ7kNvwH0Kl7d&_nc_oc=AdlMP_1EIC8tDIctiH77kqFaxuzstnpHXr4uWVDlsmz7x2ToQ8hEGiaFJjVxchf7CUg&_nc_zt=23&_nc_ht=scontent.fbri2-1.fna&_nc_gid=Soqjl95quHC1ThOZ93vkDg&oh=00_AfPyUrDMNwjvFC_AMnoIRycqFFKtaBWYDvGHMsEdqTbvDg&oe=686D94DD');">
      </div>
    </div>
    <div>
      <div class="text-2xl font-bold">{{ event.formatted_date }}</div>
      {{ props.event }}
    </div>

  </div>
</template>

<style scoped></style>
