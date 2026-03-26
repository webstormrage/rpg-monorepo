package handlers

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"scene-service/dto"
)

var slugRe = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func validateScene(scene dto.Scene) error {
	if !slugRe.MatchString(scene.Slug) {
		return errors.New("slug must match ^[a-z0-9]+(?:-[a-z0-9]+)*$")
	}

	if strings.TrimSpace(scene.Background.FilePath) == "" {
		return errors.New("background.filePath is required")
	}
	if scene.Background.Size.WidthPx <= 0 || scene.Background.Size.HeightPx <= 0 {
		return errors.New("background.size.widthPx and background.size.heightPx must be > 0")
	}

	if scene.Grid.Columns <= 0 || scene.Grid.Rows <= 0 {
		return errors.New("grid.columns and grid.rows must be > 0")
	}
	if scene.Grid.CellSizePx <= 0 {
		return errors.New("grid.cellSizePx must be > 0")
	}
	if scene.Grid.Origin.XPx < 0 || scene.Grid.Origin.YPx < 0 {
		return errors.New("grid.origin.xPx and grid.origin.yPx must be >= 0")
	}

	spriteSlugs := make(map[string]struct{}, len(scene.Sprites))
	for i, sprite := range scene.Sprites {
		if !slugRe.MatchString(sprite.Slug) {
			return fmt.Errorf("sprites[%d].slug must match ^[a-z0-9]+(?:-[a-z0-9]+)*$", i)
		}
		if _, exists := spriteSlugs[sprite.Slug]; exists {
			return fmt.Errorf("sprites[%d].slug must be unique in scene", i)
		}
		spriteSlugs[sprite.Slug] = struct{}{}

		if strings.TrimSpace(sprite.FilePath) == "" {
			return fmt.Errorf("sprites[%d].filePath is required", i)
		}
		if sprite.Size.WidthPx <= 0 || sprite.Size.HeightPx <= 0 {
			return fmt.Errorf("sprites[%d].size.widthPx and sprites[%d].size.heightPx must be > 0", i, i)
		}

		// Bottom-left coordinate system: x to the right, y upward.
		if sprite.Position.Column < 0 || sprite.Position.Column >= scene.Grid.Columns {
			return fmt.Errorf("sprites[%d].position.column must be in [0, %d)", i, scene.Grid.Columns)
		}
		if sprite.Position.Row < 0 || sprite.Position.Row >= scene.Grid.Rows {
			return fmt.Errorf("sprites[%d].position.row must be in [0, %d)", i, scene.Grid.Rows)
		}
	}

	return nil
}
