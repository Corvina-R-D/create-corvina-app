package cmd

import "testing"

func TestValidateGcpProject(t *testing.T) {
	valid := []string{"corvina-app-mobile", "corvina-app-mobile-backoffice", "abcdef", "a23456789012345678901234567890"}
	invalid := []string{"", "short", "Corvina-app", "1corvina-app", "corvina-app-", "corvina_app", "corvina-app; id", "$(id)-project", "a234567890123456789012345678901"}
	for _, project := range valid {
		if err := validateGcpProject(project); err != nil {
			t.Errorf("%q: unexpected error %v", project, err)
		}
	}
	for _, project := range invalid {
		if err := validateGcpProject(project); err == nil {
			t.Errorf("%q: expected an error", project)
		}
	}
}
