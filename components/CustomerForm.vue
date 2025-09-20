<script setup lang="ts">
import { useForm } from "vee-validate";
import * as Yup from "yup";
import provinces from "@/data/provinces";
import Dropdown from "primevue/dropdown";

interface CustomerForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  province: string;
  city: string;
  zip: string;
  invoice_requested: boolean;
  business_name: string;
  business_address: string;
  business_vat: string;
  business_pec: string;
  business_code: string;
  terms: boolean;
}

interface Props {
  loading?: boolean;
  initialValues?: CustomerForm;
  hideInvoice?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  hideInvoice: false,
  initialValues: {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country: "IT",
    province: "",
    city: "",
    zip: "",
    invoice_requested: false,
    business_name: "",
    business_address: "",
    business_vat: "",
    business_pec: "",
    business_code: "",
    terms: false,
  },
});

const { loading, initialValues } = toRefs(props);

const schema = Yup.object({
  first_name: Yup.string()
    .trim()
    .required("Nome è un campo obbligatorio")
    .label("Nome"),
  last_name: Yup.string()
    .trim()
    .required("Cognome è un campo obbligatorio")
    .label("Cognome"),
  email: Yup.string()
    .trim()
    .required("Indirizzo email è un campo obbligatorio")
    .email("Inserisci un indirizzo email valido")
    .label("Indirizzo email"),
  phone: Yup.string()
    .trim()
    .required("Numero telefono è un campo obbligatorio")
    .matches(/^[0-9]+$/, "Inserire solo numeri")
    .min(8, "Numero non valido")
    .max(10, "Numero non valido")
    .label("Numero telefono"),
  country: Yup.string()
    .trim()
    .required("Stato è un campo obbligatorio")
    .label("Stato"),
  province: Yup.string()
    .trim()
    .required("Provincia è un campo obbligatorio")
    .label("Provincia"),
  city: Yup.string()
    .trim()
    .required("Comune è un campo obbligatorio")
    .label("Comune"),
  zip: Yup.string()
    .trim()
    .required("CAP è un campo obbligatorio")
    .matches(/^[0-9]+$/, "CAP non valido")
    .min(5, "CAP non valido")
    .max(5, "CAP non valido")
    .label("CAP"),
  invoice_requested: Yup.boolean(),
  business_name: Yup.string()
    .trim()
    .when("invoice_requested", {
      is: true,
      then: (schema) => schema.required("Campo obbligatorio"),
    })
    .label("Denominazione azienda"),
  business_address: Yup.string()
    .trim()
    .when("invoice_requested", {
      is: true,
      then: (schema) => schema.required("Campo obbligatorio"),
    })
    .label("Denominazione azienda"),
  business_pec: Yup.string()
    .email("Inserisci un indirizzo email valido")
    .trim()
    .nullable()
    .label("PEC azienda")
    .when(["invoice_requested", "business_code"], {
      is: (invoice_requested: boolean, business_code: string) => invoice_requested && !business_code,
      then: (schema) =>
        schema.required("Inserisci la PEC (o compila il codice univoco)"),
    })
    .label("Codice univoco"),
  business_vat: Yup.string()
    .trim()
    .when("invoice_requested", {
      is: true,
      then: (schema) => schema.required("Campo obbligatorio"),
    })
    .label("Denominazione azienda"),
  business_code: Yup.string().trim().label("Codice univoco"),
  terms: Yup.boolean()
    .oneOf([true], "I termini e le condizioni devono essere accettati")
    .required("E' necessario accettare le condizioni")
    .label("Condizioni del servizio e privacy"),
});

const { defineField, handleSubmit, resetForm, errors } = useForm({
  validationSchema: schema,
  initialValues: initialValues.value,
});

const [first_name] = defineField("first_name");
const [last_name] = defineField("last_name");
const [email] = defineField("email");
const [phone] = defineField("phone");
const [country] = defineField("country");
const [province] = defineField("province");
const [city] = defineField("city");
const [zip] = defineField("zip");
const [invoice_requested] = defineField("invoice_requested");
const [business_name] = defineField("business_name");
const [business_address] = defineField("business_address");
const [business_vat] = defineField("business_vat");
const [business_pec] = defineField("business_pec");
const [business_code] = defineField("business_code");
const [terms] = defineField("terms");

const countries = [
  { id: "IT", name: "Italia" },
  { id: "AA", name: "-- Altro --" },
];

const onSubmit = handleSubmit((values) => {
  return values;
});
defineExpose({
  submit: onSubmit,
});
</script>

<template>
  <form @submit="onSubmit" novalidate class="mt-3 px-2 md:px-0">
    <div class="formgrid grid">
      <!-- Nome -->
      <div class="field col-12 md:col-6 flex flex-column">
        <label for="first_name">Nome<span class="b-text-red">*</span></label>
        <InputText v-model="first_name" id="first_name" placeholder="Inserisci il tuo nome" required
          aria-describedby="first_name-help" :class="{ 'p-invalid': errors.first_name }" :disabled="loading" />
        <small id="first_name-help" class="p-error" v-text="errors.first_name" />
      </div>

      <!-- Cognome -->
      <div class="field col-12 md:col-6 flex flex-column">
        <label for="last_name">Cognome<span class="b-text-red">*</span></label>
        <InputText v-model="last_name" id="last_name" placeholder="Inserisci il tuo cognome" required
          aria-describedby="last_name-help" :class="{ 'p-invalid': errors.last_name }" :disabled="loading" />
        <small id="last_name-help" class="p-error">
          {{ errors.last_name }}
        </small>
      </div>

      <!-- Email -->
      <div class="field col-12 md:col-7 flex flex-column">
        <label for="email">Email<span class="b-text-red">*</span></label>
        <InputText v-model="email" id="email" placeholder="Indirizzo email" required aria-describedby="email-help"
          :class="{ 'p-invalid': errors.email }" :disabled="loading" />
        <small id="email-help" class="p-error" v-text="errors.email" />
      </div>

      <!-- Telefono -->
      <div class="field col-12 md:col-5 flex flex-column">
        <label for="phone">Telefono<span class="b-text-red">*</span></label>
        <InputText v-model="phone" type="tel" id="phone" placeholder="Telefono" required aria-describedby="phone-help"
          :class="{ 'p-invalid': errors.phone }" :disabled="loading" />
        <small id="phone-help" class="p-error" v-text="errors.phone" />
      </div>

      <!-- Stato -->
      <!-- <div class="field col-9 md:col-2 lg:col-2 flex flex-column">
        <label for="country"
          >Paese / Regione<span class="b-text-red">*</span></label
        >
        <Dropdown
          v-model="country"
          :options="countries"
          option-value="id"
          option-label="name"
          id="country"
          required
          aria-describedby="country-help"
          :class="{ 'p-invalid': errors.country }"
          :disabled="loading"
        />
        <small id="country-help" class="p-error" v-text="errors.country" />
      </div> -->

      <!-- CAP -->
      <div class="field col-3 md:col-2 lg:col-2 flex flex-column">
        <label for="zip">CAP<span class="b-text-red">*</span></label>
        <InputText v-model="zip" id="zip" placeholder="CAP" required aria-describedby="zip-help"
          :class="{ 'p-invalid': errors.zip }" :disabled="loading" />
        <small id="zip-help" class="p-error" v-text="errors.zip" />
      </div>

      <!-- Comune -->
      <div class="field col-9 md:col-6 lg:col-6 flex flex-column">
        <label for="city">Comune<span class="b-text-red">*</span></label>
        <InputText v-model="city" id="city" placeholder="Inserisci il tuo comune di residenza" required
          aria-describedby="city-help" :class="{ 'p-invalid': errors.city }" :disabled="loading" />
        <small id="city-help" class="p-error" v-text="errors.city" />
      </div>

      <!-- Provincia -->
      <div class="field col-12 md:col-4 lg:col-4 flex flex-column">
        <label for="province">Provincia<span class="b-text-red">*</span></label>
        <Dropdown v-model="province" :options="provinces" option-value="sigla" option-label="nome" id="province"
          required aria-describedby="province-help" :class="{ 'p-invalid': errors.province }" :disabled="loading" />
        <small id="province-help" class="p-error" v-text="errors.province" />
      </div>

      <!-- Fatturazione -->
      <div class="field col-12 flex flex-column mt-2" v-if="!hideInvoice">
        <div class="flex flex-nowrap gap-3">
          <Checkbox v-model="invoice_requested" binary inputId="invoice" required aria-describedby="invoice-help"
            :class="{ 'p-invalid': errors.invoice_requested }" :disabled="loading" />
          <label for="invoice">
            Richiedi emissione fattura
            <small>(Riceverai copia del documento fiscale sulla tua email)</small>
          </label>
        </div>
        <small id="acceptTerms-help" class="p-error">
          {{ errors.invoice_requested }}
        </small>
      </div>

      <template v-if="invoice_requested">
        <!-- Denominazione azienda -->
        <div class="field col-12 flex flex-column">
          <label for="business_name">
            Denominazione azienda<span class="b-text-red">*</span></label>
          <InputText v-model="business_name" id="business_name" placeholder="es: Google SRL" required
            aria-describedby="zip-help" :class="{ 'p-invalid': errors.business_name }" :disabled="loading" />
          <small id="business_name-help" class="p-error">
            {{ errors.business_name }}
          </small>
        </div>

        <!-- Indirizzo azienda -->
        <div class="field col-12 flex flex-column">
          <label for="business_address">
            Indirizzo azienda<span class="b-text-red">*</span>
          </label>
          <InputText v-model="business_address" id="business_address"
            placeholder="es: Via Giuseppe Verdi, 15 - 87036 Rende (CS)" required
            aria-describedby="business_address-help" :class="{ 'p-invalid': errors.business_address }"
            :disabled="loading" />
          <small id="business_address-help" class="p-error">
            {{ errors.business_address }}
          </small>
        </div>

        <!-- Partita IVA o Codice fiscale -->
        <div class="field col-12 md:col-3 flex flex-column">
          <label for="business_vat">
            P. IVA o Codice fiscale<span class="b-text-red">*</span>
          </label>
          <InputText v-model="business_vat" id="business_vat" placeholder="es: 12345678901" required
            aria-describedby="business_vat-help" :class="{ 'p-invalid': errors.business_vat }" :disabled="loading" />
          <small id="business_vat-help" class="p-error">
            {{ errors.business_vat }}
          </small>
        </div>

        <!-- PEC azienda -->
        <div class="field col-12 md:col-6 flex flex-column">
          <label for="business_pec"> PEC </label>
          <InputText v-model="business_pec" id="business_pec" placeholder="Indirizzo email" required
            aria-describedby="business_pec-help" :class="{ 'p-invalid': errors.email }" :disabled="loading" />
          <small id="business_pec-help" class="p-error">
            {{ errors.business_pec }}
          </small>
        </div>

        <!-- Codice univoco -->
        <div class="field col-12 md:col-3 flex flex-column">
          <label for="business_vat"> Codice univoco </label>
          <InputText v-model="business_code" id="business_code" placeholder="es: XYZ1234" required
            aria-describedby="business_code-help" :class="{ 'p-invalid': errors.business_code }" :disabled="loading" />
          <small id="business_code-help" class="p-error">
            {{ errors.business_code }}
          </small>
        </div>
      </template>
    </div>

    <div>
      <div class="flex flex-column gap-3">
        <slot name="terms"></slot>

        <div class="field flex flex-column text-sm text-base">
          <div class="flex flex-nowrap gap-3 mt-3">
            <Checkbox v-model="terms" binary inputId="terms" required aria-describedby="terms-help"
              :class="{ 'p-invalid': errors.terms }" :disabled="loading" />
            <label for="terms">
              Sì, ho preso visione e accetto la
              <a href="https://www.oktoberfestcalabria.com/dichiarazione-sulla-privacy-ue/" target="_blank">Privacy
                Policy</a>
              e i
              <a href="https://oktoberfestcalabria.com/termini-e-condizioni/" target="_blank">Termini e
                condizioni</a>.</label>
          </div>
          <small id="terms-help" class="p-error">
            {{ errors.terms }}
          </small>
        </div>
      </div>
    </div>
    <!-- <div class="footer">
      <Button label="Submit" type="submit" />
    </div> -->
  </form>
</template>

<style scoped>
:deep(.field) {
  margin-bottom: 10px;
}

:deep(.field label) {
  font-size: 14px;
  margin-bottom: 2px;
}

/* label {
  margin-bottom: 4px;
} */
</style>
