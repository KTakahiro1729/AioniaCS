<template>
    <div id="skills" class="skills">
        <div class="box-title">技能</div>
        <ul class="skills-list box-content list-reset">
            <li v-for="skill in localSkills" :key="skill.id" class="skill-list">
                <div class="skill-header">
                    <input
                        type="checkbox"
                        :id="skill.id"
                        v-model="skill.checked"
                        :disabled="uiStore.isViewingShared"
                    />
                    <label :for="skill.id" class="skill-name">{{
                        skill.name
                    }}</label>
                </div>
                <div
                    v-if="skill.canHaveExperts && skill.checked"
                    class="experts-section"
                >
                    <ul class="expert-list list-reset">
                        <li
                            v-for="(expert, expIndex) in skill.experts"
                            :key="expIndex"
                            class="base-list-item"
                        >
                            <div
                                class="delete-button-wrapper"
                                v-if="!uiStore.isViewingShared"
                            >
                                <button
                                    type="button"
                                    class="button-base list-button list-button--delete"
                                    @click="
                                        characterStore.removeExpert(
                                            skill.id,
                                            expIndex
                                        )
                                    "
                                    :disabled="
                                        skill.experts.length <= 1 &&
                                        expert.value === ''
                                    "
                                    aria-label="専門技能を削除"
                                >
                                    －
                                </button>
                            </div>
                            <input
                                type="text"
                                v-model="expert.value"
                                :placeholder="expertPlaceholder(skill)"
                                :disabled="
                                    !skill.checked || uiStore.isViewingShared
                                "
                                class="flex-grow"
                            />
                        </li>
                    </ul>
                    <div
                        class="add-button-container-left"
                        v-if="!uiStore.isViewingShared"
                    >
                        <button
                            type="button"
                            class="button-base list-button list-button--add"
                            @click="characterStore.addExpert(skill.id)"
                            aria-label="専門技能を追加"
                        >
                            ＋
                        </button>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { useSkillsManagement } from "../../composables/features/useSkillsManagement.js";
import { useCharacterStore } from "../../stores/characterStore.js";
import { useUiStore } from "../../stores/uiStore.js";

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const localSkills = characterStore.skills;

const { expertPlaceholder } = useSkillsManagement();
</script>
